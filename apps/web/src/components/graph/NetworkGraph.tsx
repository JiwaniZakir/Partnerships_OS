'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { fetchApi } from '@/lib/api';

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
  member: '#6366F1',
  contact: '#22C55E',
  organization: '#6B7280',
};

export function NetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [nodeCount, setNodeCount] = useState(0);

  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);

  const fetchAndRender = useCallback(async () => {
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
      const data = await fetchApi<{ nodes: GraphNode[]; edges: GraphEdge[] }>('/graph/full');

      setNodeCount(data.nodes.length);
      setLoading(false);

      if (data.nodes.length === 0) return;

      // Stop any previous simulation before creating a new one
      if (simulationRef.current) {
        simulationRef.current.stop();
      }

      const simulation = d3
        .forceSimulation<GraphNode>(data.nodes)
        .force(
          'link',
          d3
            .forceLink<GraphNode, GraphEdge>(data.edges)
            .id((d) => d.id)
            .distance(100)
        )
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(20));

      simulationRef.current = simulation;

      let transform = d3.zoomIdentity;

      // Zoom behavior
      const zoom = d3.zoom<HTMLCanvasElement, unknown>()
        .scaleExtent([0.1, 8])
        .on('zoom', (event) => {
          transform = event.transform;
        });

      d3.select(canvas).call(zoom);

      // Drag behavior
      const mousedownHandler = (event: any) => {
        const [mx, my] = d3.pointer(event);
        const [tx, ty] = [
          (mx - transform.x) / transform.k,
          (my - transform.y) / transform.k,
        ];

        const node = data.nodes.find((n) => {
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

      // Resize handler to update canvas dimensions
      const handleResize = () => {
        if (!container || !canvas) return;
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        const resizeCtx = canvas.getContext('2d');
        if (resizeCtx) {
          resizeCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
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
        ctx.strokeStyle = 'rgba(156, 163, 175, 0.3)';
        ctx.lineWidth = 1;
        for (const edge of data.edges) {
          const source = edge.source as GraphNode;
          const target = edge.target as GraphNode;
          if (source.x == null || target.x == null) continue;
          ctx.beginPath();
          ctx.moveTo(source.x, source.y!);
          ctx.lineTo(target.x, target.y!);
          ctx.stroke();
        }

        // Draw nodes
        for (const node of data.nodes) {
          if (node.x == null) continue;
          const color = NODE_COLORS[node.type] || '#6B7280';
          const radius = node.type === 'member' ? 10 : node.type === 'organization' ? 8 : 6 + (node.properties.warmthScore || 0) * 6;

          ctx.beginPath();
          if (node.type === 'organization') {
            // Rounded square
            const s = radius;
            ctx.roundRect(node.x - s, node.y! - s, s * 2, s * 2, 3);
          } else {
            ctx.arc(node.x, node.y!, radius, 0, 2 * Math.PI);
          }
          ctx.fillStyle = color;
          ctx.fill();

          // Labels (only when zoomed in)
          if (transform.k > 0.8) {
            ctx.fillStyle = '#374151';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(node.label, node.x, node.y! + radius + 14);
          }
        }

        ctx.restore();
      });

      // Return cleanup info for the effect
      return { simulation, canvas, mousedownHandler, handleResize };
    } catch (err) {
      console.error('Graph fetch failed:', err);
      setLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    let cleanup: {
      simulation: d3.Simulation<GraphNode, GraphEdge>;
      canvas: HTMLCanvasElement;
      mousedownHandler: (event: any) => void;
      handleResize: () => void;
    } | null = null;

    fetchAndRender().then((result) => {
      if (result) cleanup = result;
    });

    return () => {
      if (cleanup) {
        cleanup.simulation.stop();
        cleanup.canvas.removeEventListener('mousedown', cleanup.mousedownHandler);
        window.removeEventListener('resize', cleanup.handleResize);
        // Remove D3 zoom listeners
        d3.select(cleanup.canvas).on('.zoom', null);
      }
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  }, [fetchAndRender]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-gray-50">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading network graph...</p>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg border px-3 py-2 text-xs text-gray-600">
        {nodeCount} nodes
      </div>
      <div className="absolute top-4 right-4 flex gap-2">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 bg-white/90 backdrop-blur rounded px-2 py-1 text-xs border">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
