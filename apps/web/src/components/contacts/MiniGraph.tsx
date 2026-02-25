'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { fetchApi } from '@/lib/api';
import { Network } from 'lucide-react';

const NODE_COLORS: Record<string, string> = {
  member: '#F1EFE7',
  contact: '#C4B99A',
  organization: '#6B6560',
};

interface MiniGraphProps {
  contactId: string;
}

export function MiniGraph({ contactId }: MiniGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await fetchApi<{ nodes: any[]; edges: any[] }>(`/graph/neighborhood/${contactId}`);
        if (cancelled) return;

        if (!data.nodes?.length) {
          setEmpty(true);
          return;
        }

        const width = container.clientWidth;
        const height = 200;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);

        const nodes = data.nodes;
        const edges = data.edges;

        const sim = d3.forceSimulation(nodes)
          .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(60))
          .force('charge', d3.forceManyBody().strength(-120))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collision', d3.forceCollide().radius(15));

        sim.on('tick', () => {
          ctx.clearRect(0, 0, width, height);

          // Edges
          ctx.strokeStyle = 'rgba(241, 239, 231, 0.08)';
          ctx.lineWidth = 0.8;
          for (const edge of edges) {
            const s = edge.source as any;
            const t = edge.target as any;
            if (s.x == null || t.x == null) continue;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(t.x, t.y);
            ctx.stroke();
          }

          // Nodes
          for (const node of nodes) {
            if (node.x == null) continue;
            const color = NODE_COLORS[node.type] || '#6B6560';
            const r = node.id === contactId ? 8 : 5;

            if (node.id === contactId) {
              ctx.beginPath();
              ctx.arc(node.x, node.y, r + 3, 0, 2 * Math.PI);
              ctx.fillStyle = 'rgba(241, 239, 231, 0.15)';
              ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();

            // Label
            ctx.fillStyle = '#6B6560';
            ctx.font = '8px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(node.label?.split(' ')[0] || '', node.x, node.y + r + 10);
          }
        });

        return () => { sim.stop(); };
      } catch {
        if (!cancelled) setEmpty(true);
      }
    })();

    return () => { cancelled = true; };
  }, [contactId]);

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Network className="w-6 h-6 text-[#2A2A2A] mb-2" />
        <p className="text-xs text-[#6B6560]">No graph data</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full" style={{ height: '200px' }} />
    </div>
  );
}
