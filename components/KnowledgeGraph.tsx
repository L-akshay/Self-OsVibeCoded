import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { X, ExternalLink, Share2, MoreHorizontal, Brain, Activity, Network, ChevronRight } from 'lucide-react';
import { GraphNode, GraphLink } from '../types';
import { MOCK_GRAPH_DATA } from '../constants';

export const KnowledgeGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle window resize for graph centering
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        setDimensions({
          width: svgRef.current.clientWidth,
          height: svgRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const width = dimensions.width;
    const height = dimensions.height;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const simulation = d3.forceSimulation(MOCK_GRAPH_DATA.nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(MOCK_GRAPH_DATA.links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(40));

    // Links
    const link = svg.append("g")
      .attr("stroke", "#4C6EF5")
      .attr("stroke-opacity", 0.15)
      .selectAll("line")
      .data(MOCK_GRAPH_DATA.links)
      .join("line")
      .attr("stroke-width", 1.5);

    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(MOCK_GRAPH_DATA.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d as unknown as GraphNode);
      });

    // Node Circle
    nodeGroup.append("circle")
      .attr("r", (d: any) => d.val * 3)
      .attr("fill", "#070617") // Navy background
      .attr("stroke", (d: any) => {
          if (d.type === 'PERSON') return '#D946EF';
          if (d.type === 'HABIT') return '#00D0B3';
          return '#4C6EF5';
      })
      .attr("stroke-width", 2)
      .attr("class", "transition-all duration-300")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    // Selected Ring Effect
    nodeGroup.append("circle")
        .attr("r", (d: any) => d.val * 3 + 6)
        .attr("fill", "none")
        .attr("stroke", (d: any) => {
           if (d.type === 'PERSON') return '#D946EF';
           if (d.type === 'HABIT') return '#00D0B3';
           return '#4C6EF5';
        })
        .attr("stroke-opacity", 0.5)
        .attr("stroke-dasharray", "4,4")
        .attr("class", "animate-spin-slow opacity-0")
        .classed("selected-ring", true);

    // Glow effect behind nodes
    nodeGroup.append("circle")
        .attr("r", (d: any) => d.val * 3 + 15)
        .attr("fill", (d: any) => {
          if (d.type === 'PERSON') return '#D946EF';
          if (d.type === 'HABIT') return '#00D0B3';
          return '#4C6EF5';
        })
        .attr("opacity", 0.1)
        .attr("pointer-events", "none");

    // Labels
    nodeGroup.append("text")
      .text((d: any) => d.label)
      .attr("x", (d: any) => d.val * 3 + 12)
      .attr("y", 4)
      .attr("fill", "rgba(255,255,255,0.7)")
      .style("font-size", "10px")
      .style("font-family", "JetBrains Mono")
      .style("font-weight", "500")
      .style("letter-spacing", "0.05em")
      .style("text-shadow", "0 2px 4px rgba(0,0,0,1)")
      .style("pointer-events", "none");

    // Reset selection on background click
    svg.on("click", () => setSelectedNode(null));

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroup
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, [dimensions]);

  // Helper to find connections
  const getConnections = (nodeId: string) => {
    return MOCK_GRAPH_DATA.links.filter(
      (l: any) => l.source.id === nodeId || l.target.id === nodeId
    ).map((l: any) => {
      const isSource = l.source.id === nodeId;
      return isSource ? l.target : l.source;
    });
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-navy-950/80 backdrop-blur-sm">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h3 className="text-neon-blue font-mono text-[10px] tracking-[0.2em] uppercase border border-neon-blue/30 px-3 py-1.5 rounded bg-navy-900/80 backdrop-blur-md">Semantic Neural Map</h3>
      </div>
      
      <svg ref={svgRef} className="w-full h-full" />

      {/* Side Panel for Node Details */}
      <div className={`absolute top-0 right-0 h-full w-80 lg:w-96 bg-navy-900/95 backdrop-blur-xl border-l border-white/10 shadow-[-10px_0_40px_rgba(0,0,0,0.5)] transition-transform duration-300 z-20 flex flex-col ${selectedNode ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {selectedNode && (
          <>
            {/* Panel Header */}
            <div className="p-6 border-b border-white/5 flex items-start justify-between bg-white/5">
               <div>
                 <div className={`text-[10px] font-mono uppercase tracking-widest mb-2 px-2 py-0.5 rounded w-fit ${
                   selectedNode.type === 'PERSON' ? 'text-neon-pink bg-neon-pink/10' :
                   selectedNode.type === 'HABIT' ? 'text-neon-cyan bg-neon-cyan/10' :
                   'text-neon-blue bg-neon-blue/10'
                 }`}>
                   {selectedNode.type} Node
                 </div>
                 <h2 className="text-2xl font-light text-white">{selectedNode.label}</h2>
               </div>
               <button 
                 onClick={() => setSelectedNode(null)}
                 className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
               
               {/* Neural Context Section */}
               <div className="space-y-3">
                 <div className="flex items-center gap-2 text-gray-400 text-xs font-mono uppercase tracking-wider">
                   <Brain className="w-4 h-4" />
                   <span>Neural Context</span>
                 </div>
                 <p className="text-gray-300 text-sm leading-relaxed font-light bg-black/20 p-4 rounded-xl border border-white/5">
                   {selectedNode.type === 'PERSON' && "A key connection in your professional network. Interaction frequency is trending upwards."}
                   {selectedNode.type === 'HABIT' && "A reinforced behavior pattern. Consistency score is 87% over the last 30 days."}
                   {selectedNode.type === 'TOPIC' && "A core knowledge cluster. Contains 12 linked documents and 5 sub-tasks."}
                   {selectedNode.type === 'CONTENT' && "Structured data entity extracted from recent inputs."}
                 </p>
               </div>

               {/* Metrics */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-[10px] text-gray-500 uppercase font-mono mb-1">Relevance</div>
                    <div className="text-xl font-mono text-white">{selectedNode.val * 8}%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-[10px] text-gray-500 uppercase font-mono mb-1">Last Active</div>
                    <div className="text-xl font-mono text-white">2h ago</div>
                  </div>
               </div>

               {/* Connections */}
               <div className="space-y-3">
                 <div className="flex items-center gap-2 text-gray-400 text-xs font-mono uppercase tracking-wider">
                   <Network className="w-4 h-4" />
                   <span>Linked Nodes</span>
                 </div>
                 <div className="space-y-2">
                    {getConnections(selectedNode.id).map((neighbor: any) => (
                      <div key={neighbor.id} className="flex items-center justify-between p-3 rounded-lg bg-navy-800/50 hover:bg-navy-800 border border-white/5 hover:border-neon-blue/30 transition-all group cursor-pointer" onClick={() => setSelectedNode(neighbor)}>
                         <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              neighbor.type === 'PERSON' ? 'bg-neon-pink' :
                              neighbor.type === 'HABIT' ? 'bg-neon-cyan' :
                              'bg-neon-blue'
                            }`}></div>
                            <span className="text-sm text-gray-300 group-hover:text-white">{neighbor.label}</span>
                         </div>
                         <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-neon-blue" />
                      </div>
                    ))}
                    {getConnections(selectedNode.id).length === 0 && (
                      <div className="text-xs text-gray-600 italic">No direct connections found.</div>
                    )}
                 </div>
               </div>
            </div>

            {/* Panel Footer */}
            <div className="p-6 border-t border-white/5 bg-navy-950/50 space-y-3">
               <button className="w-full py-3 rounded-xl bg-neon-blue/10 border border-neon-blue/50 text-neon-blue hover:bg-neon-blue hover:text-white transition-all text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2">
                 <Activity className="w-4 h-4" />
                 Deep Analysis
               </button>
               <div className="flex gap-3">
                  <button className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};