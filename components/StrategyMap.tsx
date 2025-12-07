import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { GitMerge, Loader2, Sparkles, Target, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { geminiService } from '../services/gemini';

export const StrategyMap: React.FC = () => {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!goal.trim()) return;

    setLoading(true);
    setTreeData(null); // Clear previous

    try {
      const data = await geminiService.generateMindMap(goal);
      if (data && data.name) {
        setTreeData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // D3 Rendering Logic
  useEffect(() => {
    if (!treeData || !svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Clear SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = Math.max(containerWidth, 800);
    const height = Math.max(containerHeight, 600);

    const root = d3.hierarchy(treeData);
    const dx = 40;
    const dy = width / (root.height + 1);

    const tree = d3.tree().nodeSize([dx, dy]);
    tree(root);

    let x0 = Infinity;
    let x1 = -Infinity;
    root.each((d: any) => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
    });

    // Zoom behavior
    const g = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10);
      
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any)
       .call(zoom.transform as any, d3.zoomIdentity.translate(width/4, height/2).scale(0.8));

    // Links
    g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#4C6EF5")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr("d", d3.linkHorizontal()
          .x((d: any) => d.y)
          .y((d: any) => d.x) as any);

    // Nodes
    const node = g.append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

    // Node Circle
    node.append("circle")
      .attr("fill", (d) => d.children ? "#070617" : "#00D0B3")
      .attr("stroke", (d) => d.children ? "#4C6EF5" : "#00D0B3")
      .attr("stroke-width", 2)
      .attr("r", 6)
      .attr("class", "cursor-pointer transition-all hover:r-8");

    // Node Text (Background)
    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", (d) => d.children ? -10 : 10)
      .attr("text-anchor", (d) => d.children ? "end" : "start")
      .text((d: any) => d.data.name)
      .attr("stroke", "#070617")
      .attr("stroke-width", 4)
      .attr("paint-order", "stroke");

    // Node Text (Foreground)
    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", (d) => d.children ? -10 : 10)
      .attr("text-anchor", (d) => d.children ? "end" : "start")
      .text((d: any) => d.data.name)
      .attr("fill", (d) => d.depth === 0 ? "#D946EF" : "#E5E7EB")
      .style("font-family", "JetBrains Mono")
      .style("font-size", (d) => d.depth === 0 ? "14px" : "11px")
      .style("font-weight", (d) => d.depth === 0 ? "700" : "400");

  }, [treeData]);

  return (
    <div className="flex flex-col h-full bg-navy-950/50 relative overflow-hidden">
      
      {/* Header & Input */}
      <div className="p-6 border-b border-white/5 bg-navy-900/80 backdrop-blur-md z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
         <div className="space-y-1">
            <h2 className="text-xl font-light text-white flex items-center gap-2">
              <GitMerge className="w-6 h-6 text-neon-pink" />
              Strategy Map
            </h2>
            <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">Recursive Goal Planning Engine</p>
         </div>

         <form onSubmit={handleGenerate} className="flex-1 w-full max-w-2xl relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Target className="w-4 h-4 text-neon-blue group-focus-within:animate-pulse" />
            </div>
            <input 
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Enter a goal (e.g., 'Launch a startup', 'Learn Japanese')..."
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-32 text-white placeholder-gray-500 focus:ring-1 focus:ring-neon-pink focus:border-neon-pink/50 transition-all font-light"
            />
            <button 
              type="submit"
              disabled={loading || !goal.trim()}
              className="absolute right-1 top-1 bottom-1 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-mono uppercase tracking-wider text-neon-pink transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deconstruct'}
            </button>
         </form>
      </div>

      {/* Main Canvas Area */}
      <div ref={containerRef} className="flex-1 relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-90">
         <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
         
         {!treeData && !loading && (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 opacity-50">
             <GitMerge className="w-16 h-16 mb-4 stroke-[1]" />
             <div className="text-sm font-mono uppercase tracking-widest">Awaiting Objective</div>
           </div>
         )}
         
         {loading && (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-navy-950/20 backdrop-blur-sm">
              <div className="relative">
                 <div className="w-16 h-16 border-t-2 border-neon-pink rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                   <Sparkles className="w-6 h-6 text-neon-pink animate-pulse" />
                 </div>
              </div>
              <div className="mt-6 text-neon-pink font-mono text-xs uppercase tracking-[0.2em] animate-pulse">Generating Strategy Protocol</div>
           </div>
         )}

         <svg ref={svgRef} className="w-full h-full cursor-move active:cursor-grabbing" />
         
         {/* Controls Overlay */}
         {treeData && (
           <div className="absolute bottom-6 right-6 flex flex-col gap-2">
              <button className="p-3 rounded-full bg-navy-800 border border-white/10 text-gray-400 hover:text-white hover:border-neon-blue transition-all shadow-lg">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button className="p-3 rounded-full bg-navy-800 border border-white/10 text-gray-400 hover:text-white hover:border-neon-blue transition-all shadow-lg">
                <ZoomOut className="w-4 h-4" />
              </button>
              <button className="p-3 rounded-full bg-navy-800 border border-white/10 text-gray-400 hover:text-white hover:border-neon-blue transition-all shadow-lg">
                <Maximize className="w-4 h-4" />
              </button>
           </div>
         )}
      </div>
    </div>
  );
};