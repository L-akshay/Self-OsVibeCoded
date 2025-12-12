import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { GitMerge, Loader2, Sparkles, Target, ZoomIn, ZoomOut, Maximize, MousePointerClick, Command, ChevronRight, Focus, Share2 } from 'lucide-react';
import { geminiService } from '../services/gemini';

interface StrategyMapProps {
  onInteraction: (type: 'MAP') => void;
}

export const StrategyMap: React.FC<StrategyMapProps> = ({ onInteraction }) => {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<any>(null);
  const [expandingNode, setExpandingNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!goal.trim()) return;

    setLoading(true);
    setTreeData(null); 

    try {
      const data = await geminiService.generateMindMap(goal);
      if (data && data.name) {
        setTreeData(data);
        onInteraction('MAP');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (nodeData: any) => {
    // Only expand leaf nodes or re-expand if needed
    if (expandingNode || (nodeData.children && nodeData.children.length > 0)) return;

    setExpandingNode(nodeData.data.name);

    try {
      const newChildren = await geminiService.expandStrategyNode(nodeData.data.name, goal);
      
      if (newChildren && newChildren.length > 0) {
        // Deep clone tree to update
        const updateTree = (node: any): any => {
          if (node.name === nodeData.data.name) {
             return { ...node, children: newChildren };
          }
          if (node.children) {
             return { ...node, children: node.children.map(updateTree) };
          }
          return node;
        };

        setTreeData((prev: any) => updateTree(prev));
        onInteraction('MAP');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExpandingNode(null);
    }
  };

  // --- D3 Rendering Logic ---
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Clear SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // 1. Setup Zoom & Pan Groups
    const zoomGroup = svg.append("g").attr("class", "zoom-group");
    
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
        // Parallax effect for grid? Or just move it.
        // For simple dot grid, we can just apply transform.
      });

    svg.call(zoom as any);

    // 2. Define Gradients & Markers
    const defs = svg.append("defs");
    
    // Link Gradient
    const gradient = defs.append("linearGradient")
      .attr("id", "link-gradient")
      .attr("gradientUnits", "userSpaceOnUse");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#4C6EF5").attr("stop-opacity", 0.3);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#D946EF").attr("stop-opacity", 0.6);

    // Grid Pattern
    const pattern = defs.append("pattern")
      .attr("id", "grid-pattern")
      .attr("width", 40)
      .attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse");
    pattern.append("circle")
      .attr("cx", 2)
      .attr("cy", 2)
      .attr("r", 1)
      .attr("fill", "#4C6EF5")
      .attr("opacity", 0.2);

    // Background Rect for Grid
    // We append this to zoomGroup so it moves with the nodes, creating a "canvas" feel
    // To make it infinite, we typically render a huge rect or use background-image CSS. 
    // Using a huge rect inside zoomGroup for 'feeling' of space.
    zoomGroup.append("rect")
      .attr("x", -50000)
      .attr("y", -50000)
      .attr("width", 100000)
      .attr("height", 100000)
      .attr("fill", "url(#grid-pattern)")
      .attr("pointer-events", "none"); // Let clicks pass through to svg zoom handler

    if (!treeData) {
        // Initial center
        svg.call(zoom.transform as any, d3.zoomIdentity.translate(containerWidth/2, containerHeight/2).scale(1));
        return;
    }

    // 3. Compute Layout
    // Use fixed node size for "cards"
    const nodeWidth = 220;
    const nodeHeight = 80;
    const paddingX = 50; 
    const paddingY = 100;

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree().nodeSize([nodeHeight + paddingX, nodeWidth + paddingY]);
    treeLayout(root);

    // 4. Render Links
    // Calculate bounding box to center view
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    root.each((d: any) => {
      if (d.x < x0) x0 = d.x;
      if (d.x > x1) x1 = d.x;
      if (d.y < y0) y0 = d.y;
      if (d.y > y1) y1 = d.y;
    });
    
    // Links
    zoomGroup.append("g")
      .attr("fill", "none")
      .attr("stroke", "url(#link-gradient)")
      .attr("stroke-width", 2)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr("d", d3.linkHorizontal()
          .x((d: any) => d.y)
          .y((d: any) => d.x) as any)
      .attr("class", "animate-in fade-in duration-1000");

    // 5. Render Nodes (ForeignObject for HTML Cards)
    const node = zoomGroup.append("g")
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`)
      .attr("class", "cursor-pointer group focus:outline-none");

    // HTML Foreign Object Card
    node.append("foreignObject")
      .attr("x", -10) // slight offset for alignment
      .attr("y", -30) // center vertically roughly
      .attr("width", 200)
      .attr("height", 100) // Allow growth? Fixed for now
      .on("click", (event, d) => handleExpand(d))
      .append("xhtml:div")
      .style("width", "100%")
      .style("height", "100%")
      .html((d: any) => {
         const isRoot = d.depth === 0;
         const isLeaf = !d.children && !d.data.children; // check data.children for collapsed state if implemented
         const isExpanding = d.data.name === expandingNode;
         
         // Tailwind classes inside string
         // Note: We need to use inline styles or ensure Tailwind classes are available globally. 
         // Since we are in React, these classes work if Tailwind is loaded in index.html
         return `
           <div class="flex items-center p-3 rounded-xl border backdrop-blur-md transition-all duration-300 
             ${isRoot 
                ? 'bg-neon-purple/20 border-neon-purple/50 shadow-[0_0_30px_rgba(217,70,239,0.2)]' 
                : 'bg-navy-900/80 border-white/10 hover:border-neon-blue/50 hover:bg-navy-800'
             }
             ${isExpanding ? 'animate-pulse border-neon-cyan' : ''}
           ">
             <div class="flex-1 min-w-0">
               <div class="text-[10px] font-mono uppercase tracking-wider mb-1 ${isRoot ? 'text-neon-purple' : 'text-gray-500'}">
                 ${isRoot ? 'OBJECTIVE' : `STEP 0${d.depth}`}
               </div>
               <div class="text-sm text-white font-medium leading-snug break-words line-clamp-2">
                 ${d.data.name}
               </div>
             </div>
             ${isLeaf && !isRoot ? `
               <div class="ml-2 p-1 rounded-full bg-white/5 group-hover:bg-neon-blue group-hover:text-white text-gray-500 transition-colors">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                   <path d="M5 12h14M12 5l7 7-7 7"/>
                 </svg>
               </div>
             ` : ''}
           </div>
         `;
      });

      // Center View on initial load
      if (treeData && loading === false) {
         const initialScale = 0.9;
         // Approximate centering - simplified
         svg.transition().duration(750).call(
            zoom.transform as any,
            d3.zoomIdentity
               .translate(containerWidth / 2 - (y0 + y1) / 2 * initialScale, containerHeight / 2 - (x0 + x1) / 2 * initialScale) // Swap x/y for tree orientation
               .translate(-100, 0) // Shift slightly left to show root
               .scale(initialScale)
         );
      }

  }, [treeData, expandingNode]);

  return (
    <div className="flex flex-col h-full bg-navy-950 relative overflow-hidden group/canvas">
      
      {/* 1. Canvas Area */}
      <div ref={containerRef} className="absolute inset-0 z-0 bg-navy-950">
         
         {!treeData && !loading && (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 opacity-40 pointer-events-none select-none">
             <div className="w-[400px] h-[400px] bg-gradient-radial from-neon-blue/5 to-transparent rounded-full blur-3xl absolute"></div>
             <GitMerge className="w-24 h-24 mb-6 stroke-[0.5] text-neon-blue/50" />
             <div className="text-sm font-mono uppercase tracking-[0.3em] text-neon-blue/50">Strategy Canvas Empty</div>
             <div className="mt-2 text-xs text-gray-600 font-light">Enter a goal below to initialize neural planning</div>
           </div>
         )}
         
         {loading && (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-navy-950/60 backdrop-blur-sm transition-all duration-500">
              <div className="relative">
                 <div className="w-20 h-20 border-t-2 border-r-2 border-neon-pink rounded-full animate-spin"></div>
                 <div className="w-16 h-16 border-b-2 border-l-2 border-neon-cyan rounded-full animate-spin absolute inset-2 animation-delay-150"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                   <Sparkles className="w-8 h-8 text-white animate-pulse" />
                 </div>
              </div>
              <div className="mt-8 text-white font-mono text-xs uppercase tracking-[0.3em] animate-pulse flex flex-col items-center gap-2">
                 <span>Constructing Neural Map</span>
                 <span className="text-[10px] text-gray-500">Thinking Budget: 2048 Tokens</span>
              </div>
           </div>
         )}

         <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      </div>

      {/* 2. Floating Top Right Controls */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
          <div className="bg-navy-900/90 backdrop-blur border border-white/10 rounded-xl p-1 shadow-xl flex flex-col">
            <button className="p-2.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button className="p-2.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button className="p-2.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Fit to Screen">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
          
          <button className="p-3 bg-navy-900/90 backdrop-blur border border-white/10 rounded-xl text-gray-400 hover:text-neon-blue hover:border-neon-blue/50 transition-colors shadow-xl" title="Export Map">
            <Share2 className="w-4 h-4" />
          </button>
      </div>

      {/* 3. Floating Command Bar (Input) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-30">
         <form 
           onSubmit={handleGenerate} 
           className="relative group transition-all duration-300 hover:scale-[1.01]"
         >
            {/* Glow Effect */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink rounded-2xl opacity-0 group-focus-within:opacity-70 blur transition duration-500 ${loading ? 'opacity-50 animate-pulse' : ''}`}></div>
            
            <div className="relative flex items-center bg-navy-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
               <div className="pl-5 pr-3 text-gray-500">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin text-neon-pink" /> : <Command className="w-5 h-5" />}
               </div>
               
               <input 
                 type="text"
                 value={goal}
                 onChange={(e) => setGoal(e.target.value)}
                 placeholder="What is your objective? (e.g. 'Launch a SaaS', 'Learn Piano')"
                 className="w-full bg-transparent border-none py-4 px-2 text-lg font-light text-white placeholder-gray-500 focus:ring-0 font-sans"
                 disabled={loading}
               />
               
               <div className="pr-2 flex items-center gap-2">
                 {goal && !loading && (
                   <button 
                     type="submit"
                     className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono uppercase tracking-widest text-white transition-colors flex items-center gap-2"
                   >
                     <span>Generate</span>
                     <div className="w-4 h-4 flex items-center justify-center bg-white/20 rounded text-[8px]">↵</div>
                   </button>
                 )}
               </div>
            </div>
            
            {/* Helper Text */}
            <div className="absolute -bottom-8 left-0 right-0 text-center opacity-0 group-focus-within:opacity-100 transition-opacity duration-500">
               <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest flex items-center justify-center gap-2">
                 <Sparkles className="w-3 h-3 text-neon-blue" />
                 Powered by Gemini 3.0 Pro Reasoning
               </span>
            </div>
         </form>
      </div>

    </div>
  );
};