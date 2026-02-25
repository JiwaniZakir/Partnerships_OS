'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { fetchApi } from '@/lib/api';
import { Network } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'member' | 'contact' | 'organization';
  properties: Record<string, any>;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}

const NODE_COLORS: Record<string, string> = {
  member: '#F1EFE7',
  contact: '#C4B99A',
  organization: '#6B6560',
};

interface NetworkGraphProps {
  filterTypes?: string[];
  searchHighlight?: string | null;
  onNodeClick?: (node: GraphNode) => void;
}

export function NetworkGraph({ filterTypes, searchHighlight, onNodeClick }: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [nodeCount, setNodeCount] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const allDataRef = useRef<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);

  const fetchAndRender = useCallback(
    async (types?: string[]) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      let width = container.clientWidth;
      let height = container.clientHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      try {
        if (!allDataRef.current) {
          allDataRef.current = await fetchApi<{ nodes: GraphNode[]; edges: GraphEdge[] }>('/graph/full');
        }

        const allData = allDataRef.current;
        const filteredNodeIds = new Set(
          allData.nodes.filter((n) => !types || types.includes(n.type)).map((n) => n.id)
        );

        const nodes = allData.nodes.filter((n) => filteredNodeIds.has(n.id));
        const edges = allData.edges.filter((e) => {
          const sourceId = typeof e.source === 'string' ? e.source : e.source.id;
          const targetId = typeof e.target === 'string' ? e.target : e.target.id;
          return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
        });

        setNodeCount(nodes.length);
        setLoading(false);

        if (nodes.length === 0) return;

        if (simulationRef.current) simulationRef.current.stop();

        const simulation = d3
          .forceSimulation<GraphNode>(nodes)
          .force('link', d3.forceLink<GraphNode, GraphEdge>(edges).id((d) => d.id).distance(100))
          .force('charge', d3.forceManyBody().strength(-200))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collision', d3.forceCollide().radius(20));

        simulationRef.current = simulation;

        let transform = d3.zoomIdentity;

        const zoom = d3.zoom<HTMLCanvasElement, unknown>()
          .scaleExtent([0.1, 8])
          .on('zoom', (event) => { transform = event.transform; });

        d3.select(canvas).call(zoom);

        const mousemoveHandler = (event: MouseEvent) => {
          const [mx, my] = [event.offsetX, event.offsetY];
          const [tx, ty] = [(mx - transform.x) / transform.k, (my - transform.y) / transform.k];

          const node = nodes.find((n) => {
            const dx = (n.x || 0) - tx;
            const dy = (n.y || 0) - ty;
            return Math.sqrt(dx * dx + dy * dy) < 15;
          });

          setHoveredNode(node || null);
          canvas.style.cursor = node ? 'pointer' : 'default';
        };

        canvas.addEventListener('mousemove', mousemoveHandler);

        const clickHandler = (event: MouseEvent) => {
          const [mx, my] = [event.offsetX, event.offsetY];
          const [tx, ty] = [(mx - transform.x) / transform.k, (my - transform.y) / transform.k];

          const node = nodes.find((n) => {
            const dx = (n.x || 0) - tx;
            const dy = (n.y || 0) - ty;
            return Math.sqrt(dx * dx + dy * dy) < 15;
          });

          if (node && onNodeClick) onNodeClick(node);
        };

        canvas.addEventListener('click', clickHandler);

        const mousedownHandler = (event: MouseEvent) => {
          const [mx, my] = d3.pointer(event);
          const [tx, ty] = [(mx - transform.x) / transform.k, (my - transform.y) / transform.k];

          const node = nodes.find((n) => {
            const dx = (n.x || 0) - tx;
            const dy = (n.y || 0) - ty;
            return Math.sqrt(dx * dx + dy * dy) < 15;
          });

          if (node) {
            node.fx = node.x;
            node.fy = node.y;

            const onMove = (e: MouseEvent) => {
              const [mx2, my2] = [e.offsetX, e.offsetY];
              node.fx = (mx2 - transform.x) / transform.k;
              node.fy = (my2 - transform.y) / transform.k;
              simulation.alpha(0.3).restart();
            };

            const onUp = () => {
              node.fx = null;
              node.fy = null;
              canvas.removeEventListener('mousemove', onMove);
              canvas.removeEventListener('mouseup', onUp);
            };

            canvas.addEventListener('mousemove', onMove);
            canvas.addEventListener('mouseup', onUp);
          }
        };

        canvas.addEventListener('mousedown', mousedownHandler);

        const handleResize = () => {
          if (!container || !canvas) return;
          width = container.clientWidth;
          height = container.clientHeight;
          canvas.width = width * window.devicePixelRatio;
          canvas.height = height * window.devicePixelRatio;
          canvas.style.width = width + 'px';
          canvas.style.height = height + 'px';
          const resizeCtx = canvas.getContext('2d');
          if (resizeCtx) resizeCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
          simulation.force('center', d3.forceCenter(width / 2, height / 2));
          simulation.alpha(0.3).restart();
        };

        window.addEventListener('resize', handleResize);

        simulation.on('tick', () => {
          ctx.save();
          ctx.clearRect(0, 0, width, height);
          ctx.translate(transform.x, transform.y);
          ctx.scale(transform.k, transform.k);

          // Draw edges
          ctx.strokeStyle = 'rgba(241, 239, 231, 0.08)';
          ctx.lineWidth = 0.8;
          for (const edge of edges) {
            const source = edge.source as GraphNode;
            const target = edge.target as GraphNode;
            if (source.x == null || target.x == null) continue;
            ctx.beginPath();
            ctx.moveTo(source.x, source.y!);
            ctx.lineTo(target.x, target.y!);
            ctx.stroke();
          }

          // Draw nodes
          for (const node of nodes) {
            if (node.x == null) continue;
            const color = NODE_COLORS[node.type] || '#6B6560';
            const radius = node.type === 'member' ? 10 : node.type === 'organization' ? 8 : 6 + (node.properties.warmthScore || 0) * 6;

            const isHighlighted = searchHighlight && node.label.toLowerCase().includes(searchHighlight.toLowerCase());

            // Glow for hovered or search-highlighted node
            if (hoveredNode?.id === node.id || isHighlighted) {
              ctx.beginPath();
              ctx.arc(node.x, node.y!, radius + 6, 0, 2 * Math.PI);
              ctx.fillStyle = isHighlighted ? 'rgba(241, 239, 231, 0.2)' : color + '30';
              ctx.fill();
            }

            ctx.beginPath();
            if (node.type === 'organization') {
              const s = radius;
              ctx.roundRect(node.x - s, node.y! - s, s * 2, s * 2, 3);
            } else {
              ctx.arc(node.x, node.y!, radius, 0, 2 * Math.PI);
            }
            ctx.fillStyle = color;
            ctx.fill();

            // Labels (only when zoomed in)
            if (transform.k > 0.8) {
              ctx.fillStyle = '#A0998A';
              ctx.font = '10px Inter, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(node.label, node.x, node.y! + radius + 14);
            }
          }

          ctx.restore();
        });

        return { simulation, canvas, mousedownHandler, mousemoveHandler, clickHandler, handleResize };
      } catch (err) {
        console.error('Graph fetch failed:', err);
        setLoading(false);
        return null;
      }
    },
    [hoveredNode, searchHighlight, onNodeClick]
  );

  useEffect(() => {
    let cleanup: any = null;
    fetchAndRender(filterTypes).then((result) => { if (result) cleanup = result; });

    return () => {
      if (cleanup) {
        cleanup.simulation.stop();
        cleanup.canvas.removeEventListener('mousedown', cleanup.mousedownHandler);
        cleanup.canvas.removeEventListener('mousemove', cleanup.mousemoveHandler);
        cleanup.canvas.removeEventListener('click', cleanup.clickHandler);
        window.removeEventListener('resize', cleanup.handleResize);
        d3.select(cleanup.canvas).on('.zoom', null);
      }
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  }, [fetchAndRender, filterTypes]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#0A0A0A]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0A]/80 z-10">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#F1EFE7] border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-[#6B6560]">Loading network graph...</p>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Node count */}
      <div className="absolute bottom-4 left-4 bg-[#1A1A1A]/90 backdrop-blur rounded-lg border border-[#2A2A2A] px-3 py-2 text-xs text-[#A0998A] flex items-center gap-2">
        <Network className="w-3.5 h-3.5" />
        {nodeCount} nodes
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 flex gap-2">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 bg-[#1A1A1A]/90 backdrop-blur rounded px-2 py-1 text-xs border border-[#2A2A2A]">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize text-[#A0998A]">{type}</span>
          </div>
        ))}
      </div>

      {/* Hovered node tooltip */}
      {hoveredNode && !onNodeClick && (
        <div className="absolute bottom-4 right-4 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] shadow-xl p-3 max-w-xs z-20">
          <p className="text-sm font-semibold text-[#F1EFE7]">{hoveredNode.label}</p>
          <p className="text-xs text-[#6B6560] capitalize">{hoveredNode.type}</p>
          {hoveredNode.properties.organization && (
            <p className="text-xs text-[#A0998A] mt-1">
              {hoveredNode.properties.title} at {hoveredNode.properties.organization}
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && nodeCount === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Network className="w-10 h-10 text-[#2A2A2A] mx-auto mb-3" />
            <p className="text-sm text-[#6B6560]">No graph data yet. Add contacts to see your network.</p>
          </div>
        </div>
      )}
    </div>
  );
}
