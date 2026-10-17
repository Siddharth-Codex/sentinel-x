import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Layers, 
  Laptop,
  Globe,
  X
} from 'lucide-react';
import { FlowRecord } from '../../types/network';
import { Alert } from '../../types/alerts';
import { useSecurity } from '../../context/SecurityContext';
import { SeverityBadge } from '../common/Badge';
import { isPrivateIPv4 } from '../../lib/validation/validator';

interface Node {
  id: string;
  ip: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  subnet: string;
  isExternal: boolean;
  totalFlows: number;
  bytesIn: number;
  bytesOut: number;
  alerts: Alert[];
  highestSeverity?: Alert['severity'];
  ports: Set<number>;
  firstSeen: number;
  lastSeen: number;
}

interface Edge {
  source: string;
  destination: string;
  flowCount: number;
  totalBytes: number;
  protocols: Set<string>;
  alerts: Alert[];
}

export const NetworkGraph: React.FC = () => {
  const { flows, alerts, setSelectedAlert, theme } = useSecurity();
  const isDark = theme === 'dark';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport transform state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Filter state
  const [searchFilter, setSearchFilter] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string>('ALL');
  const [showSubnetClusters, setShowSubnetClusters] = useState(true);

  // Selection state
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // Build Graph Topology from flows & alerts
  const { nodes, edges, subnets } = useMemo(() => {
    const nodeMap = new Map<string, Node>();
    const edgeMap = new Map<string, Edge>();
    const subnetSet = new Set<string>();

    const activeFlows = protocolFilter === 'ALL' 
      ? flows 
      : flows.filter(f => f.protocol === protocolFilter);

    for (const flow of activeFlows) {
      if (!nodeMap.has(flow.source_ip)) {
        const isExt = !isPrivateIPv4(flow.source_ip);
        const subnetParts = flow.source_ip.split('.');
        const subnet = isExt ? 'External WAN' : `${subnetParts[0]}.${subnetParts[1]}.${subnetParts[2]}.0/24`;
        subnetSet.add(subnet);

        nodeMap.set(flow.source_ip, {
          id: flow.source_ip,
          ip: flow.source_ip,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          radius: 18,
          subnet,
          isExternal: isExt,
          totalFlows: 0,
          bytesIn: 0,
          bytesOut: 0,
          alerts: [],
          ports: new Set(),
          firstSeen: flow.timestampMs,
          lastSeen: flow.timestampMs
        });
      }

      if (!nodeMap.has(flow.destination_ip)) {
        const isExt = !isPrivateIPv4(flow.destination_ip);
        const subnetParts = flow.destination_ip.split('.');
        const subnet = isExt ? 'External WAN' : `${subnetParts[0]}.${subnetParts[1]}.${subnetParts[2]}.0/24`;
        subnetSet.add(subnet);

        nodeMap.set(flow.destination_ip, {
          id: flow.destination_ip,
          ip: flow.destination_ip,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          radius: 18,
          subnet,
          isExternal: isExt,
          totalFlows: 0,
          bytesIn: 0,
          bytesOut: 0,
          alerts: [],
          ports: new Set(),
          firstSeen: flow.timestampMs,
          lastSeen: flow.timestampMs
        });
      }

      const src = nodeMap.get(flow.source_ip)!;
      src.totalFlows++;
      src.bytesOut += flow.bytes_sent;
      src.ports.add(flow.source_port);
      src.firstSeen = Math.min(src.firstSeen, flow.timestampMs);
      src.lastSeen = Math.max(src.lastSeen, flow.timestampMs);

      const dst = nodeMap.get(flow.destination_ip)!;
      dst.totalFlows++;
      dst.bytesIn += flow.bytes_received;
      dst.ports.add(flow.destination_port);
      dst.firstSeen = Math.min(dst.firstSeen, flow.timestampMs);
      dst.lastSeen = Math.max(dst.lastSeen, flow.timestampMs);

      const edgeKey = `${flow.source_ip}->${flow.destination_ip}`;
      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, {
          source: flow.source_ip,
          destination: flow.destination_ip,
          flowCount: 0,
          totalBytes: 0,
          protocols: new Set(),
          alerts: []
        });
      }
      const edge = edgeMap.get(edgeKey)!;
      edge.flowCount++;
      edge.totalBytes += flow.bytes_sent + flow.bytes_received;
      edge.protocols.add(flow.protocol);
    }

    // Attach alerts to nodes and edges
    for (const alert of alerts) {
      const srcNode = nodeMap.get(alert.source_ip);
      if (srcNode) {
        srcNode.alerts.push(alert);
        if (!srcNode.highestSeverity || alert.severity === 'CRITICAL' || (alert.severity === 'HIGH' && srcNode.highestSeverity !== 'CRITICAL')) {
          srcNode.highestSeverity = alert.severity;
        }
      }

      if (alert.destination_ip) {
        const dstNode = nodeMap.get(alert.destination_ip);
        if (dstNode) {
          dstNode.alerts.push(alert);
        }

        const edgeKey = `${alert.source_ip}->${alert.destination_ip}`;
        if (edgeMap.has(edgeKey)) {
          edgeMap.get(edgeKey)!.alerts.push(alert);
        }
      }
    }

    const nodeList = Array.from(nodeMap.values());
    const subnetArray = Array.from(subnetSet);

    // Initial radial layout clustered by subnets
    subnetArray.forEach((subnet, sIdx) => {
      const clusterAngle = (sIdx / subnetArray.length) * Math.PI * 2;
      const clusterRadius = 260;
      const cx = Math.cos(clusterAngle) * clusterRadius;
      const cy = Math.sin(clusterAngle) * clusterRadius;

      const subnetNodes = nodeList.filter(n => n.subnet === subnet);
      subnetNodes.forEach((node, nIdx) => {
        const nodeAngle = (nIdx / Math.max(1, subnetNodes.length)) * Math.PI * 2;
        const nodeRadius = Math.min(140, 30 + subnetNodes.length * 8);
        node.x = cx + Math.cos(nodeAngle) * nodeRadius;
        node.y = cy + Math.sin(nodeAngle) * nodeRadius;
        node.radius = Math.min(26, 16 + Math.log2(node.totalFlows + 1) * 2);
      });
    });

    return {
      nodes: nodeList,
      edges: Array.from(edgeMap.values()),
      subnets: subnetArray
    };
  }, [flows, alerts, protocolFilter]);

  // Main Canvas Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particleOffset = 0;

    const render = () => {
      particleOffset += 0.015;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Light theme subtle background grid fill
      if (!isDark) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.save();
      // Apply pan and zoom
      ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
      ctx.scale(zoom, zoom);

      // 1. Draw Subnet Clustering Backgrounds
      if (showSubnetClusters) {
        subnets.forEach(subnet => {
          const subnetNodes = nodes.filter(n => n.subnet === subnet);
          if (subnetNodes.length === 0) return;
          const avgX = subnetNodes.reduce((acc, n) => acc + n.x, 0) / subnetNodes.length;
          const avgY = subnetNodes.reduce((acc, n) => acc + n.y, 0) / subnetNodes.length;
          const maxDist = Math.max(...subnetNodes.map(n => Math.hypot(n.x - avgX, n.y - avgY))) + 45;

          ctx.beginPath();
          ctx.arc(avgX, avgY, maxDist, 0, Math.PI * 2);
          if (isDark) {
            ctx.fillStyle = subnet === 'External WAN' ? 'rgba(239, 68, 68, 0.04)' : 'rgba(56, 189, 248, 0.03)';
            ctx.strokeStyle = subnet === 'External WAN' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.12)';
          } else {
            ctx.fillStyle = subnet === 'External WAN' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(2, 132, 199, 0.04)';
            ctx.strokeStyle = subnet === 'External WAN' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(2, 132, 199, 0.2)';
          }
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);

          // Subnet label
          ctx.font = '10px JetBrains Mono';
          if (isDark) {
            ctx.fillStyle = subnet === 'External WAN' ? 'rgba(248, 113, 113, 0.6)' : 'rgba(56, 189, 248, 0.6)';
          } else {
            ctx.fillStyle = subnet === 'External WAN' ? '#b91c1c' : '#0284c7';
          }
          ctx.textAlign = 'center';
          ctx.fillText(subnet, avgX, avgY - maxDist + 16);
        });
      }

      // 2. Draw Directed Edges
      edges.forEach(edge => {
        const src = nodes.find(n => n.id === edge.source);
        const dst = nodes.find(n => n.id === edge.destination);
        if (!src || !dst) return;

        const isHighlighted = (selectedNode && (selectedNode.id === src.id || selectedNode.id === dst.id)) ||
                              (selectedEdge && selectedEdge.source === edge.source && selectedEdge.destination === edge.destination);

        const hasAlert = edge.alerts.length > 0;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(dst.x, dst.y);

        if (hasAlert) {
          ctx.strokeStyle = isDark ? 'rgba(244, 63, 94, 0.65)' : 'rgba(225, 29, 72, 0.7)';
          ctx.lineWidth = 2.5;
        } else if (isHighlighted) {
          ctx.strokeStyle = isDark ? 'rgba(34, 211, 238, 0.8)' : 'rgba(2, 132, 199, 0.85)';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.35)' : 'rgba(203, 213, 225, 0.8)';
          ctx.lineWidth = Math.min(3, 1 + Math.log10(edge.flowCount + 1));
        }
        ctx.stroke();

        // Animated flow particles along active edge
        const dist = Math.hypot(dst.x - src.x, dst.y - src.y);
        if (dist > 0) {
          const t = (particleOffset * (hasAlert ? 2 : 1)) % 1;
          const px = src.x + (dst.x - src.x) * t;
          const py = src.y + (dst.y - src.y) * t;

          ctx.beginPath();
          ctx.arc(px, py, hasAlert ? 3 : 2, 0, Math.PI * 2);
          ctx.fillStyle = hasAlert ? '#F43F5E' : (isDark ? '#38BDF8' : '#0284c7');
          ctx.shadowColor = hasAlert ? '#F43F5E' : (isDark ? '#38BDF8' : '#0284c7');
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 3. Draw Nodes
      nodes.forEach(node => {
        const isMatch = !searchFilter || node.ip.toLowerCase().includes(searchFilter.toLowerCase());
        const isSelected = selectedNode?.id === node.id;
        const hasAlerts = node.alerts.length > 0;

        // Base glow if critical or high alert
        if (node.highestSeverity === 'CRITICAL') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? 'rgba(244, 63, 94, 0.2)' : 'rgba(225, 29, 72, 0.15)';
          ctx.fill();
        } else if (node.highestSeverity === 'HIGH') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.15)';
          ctx.fill();
        }

        // Node Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

        if (node.highestSeverity === 'CRITICAL') {
          ctx.fillStyle = isDark ? '#1e111a' : '#ffe4e6';
          ctx.strokeStyle = '#F43F5E';
        } else if (node.highestSeverity === 'HIGH') {
          ctx.fillStyle = isDark ? '#1e1a11' : '#fef3c7';
          ctx.strokeStyle = '#F59E0B';
        } else if (node.isExternal) {
          ctx.fillStyle = isDark ? '#161922' : '#f1f5f9';
          ctx.strokeStyle = '#64748B';
        } else {
          ctx.fillStyle = isDark ? '#0f172a' : '#e0f2fe';
          ctx.strokeStyle = isDark ? '#38BDF8' : '#0284c7';
        }

        ctx.lineWidth = isSelected ? 3 : 1.5;
        if (isSelected) {
          ctx.strokeStyle = isDark ? '#22D3EE' : '#0284c7';
          ctx.shadowColor = isDark ? '#22D3EE' : '#0284c7';
          ctx.shadowBlur = 10;
        }

        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // IP Label below node
        ctx.font = '11px JetBrains Mono';
        ctx.textAlign = 'center';
        if (isDark) {
          ctx.fillStyle = isMatch ? (isSelected ? '#22D3EE' : '#F8FAFC') : '#64748B';
        } else {
          ctx.fillStyle = isMatch ? (isSelected ? '#0284c7' : '#0f172a') : '#94a3b8';
        }
        ctx.fillText(node.ip, node.x, node.y + node.radius + 14);

        // Alert count pill badge if alerts present
        if (hasAlerts) {
          const pillX = node.x + node.radius - 4;
          const pillY = node.y - node.radius + 4;
          ctx.beginPath();
          ctx.arc(pillX, pillY, 7, 0, Math.PI * 2);
          ctx.fillStyle = node.highestSeverity === 'CRITICAL' ? '#F43F5E' : '#F59E0B';
          ctx.fill();

          ctx.font = 'bold 9px JetBrains Mono';
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(node.alerts.length), pillX, pillY);
          ctx.textBaseline = 'alphabetic';
        }
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, edges, subnets, zoom, pan, searchFilter, selectedNode, selectedEdge, showSubnetClusters, isDark]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight || 580;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hit testing on click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const worldX = (clickX - canvas.width / 2 - pan.x) / zoom;
    const worldY = (clickY - canvas.height / 2 - pan.y) / zoom;

    let hitNode: Node | null = null;
    for (const node of nodes) {
      const dist = Math.hypot(node.x - worldX, node.y - worldY);
      if (dist <= node.radius + 5) {
        hitNode = node;
        break;
      }
    }

    if (hitNode) {
      setSelectedNode(hitNode);
      setSelectedEdge(null);
      return;
    }

    let hitEdge: Edge | null = null;
    for (const edge of edges) {
      const src = nodes.find(n => n.id === edge.source);
      const dst = nodes.find(n => n.id === edge.destination);
      if (!src || !dst) continue;

      const l2 = (dst.x - src.x) ** 2 + (dst.y - src.y) ** 2;
      if (l2 === 0) continue;
      const t = Math.max(0, Math.min(1, ((worldX - src.x) * (dst.x - src.x) + (worldY - src.y) * (dst.y - src.y)) / l2));
      const projX = src.x + t * (dst.x - src.x);
      const projY = src.y + t * (dst.y - src.y);
      const dist = Math.hypot(worldX - projX, worldY - projY);

      if (dist < 8) {
        hitEdge = edge;
        break;
      }
    }

    if (hitEdge) {
      setSelectedEdge(hitEdge);
      setSelectedNode(null);
      return;
    }

    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.min(3.5, Math.max(0.3, prev * factor)));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  return (
    <div className={`relative w-full h-[640px] rounded-2xl overflow-hidden flex flex-col border transition-colors ${
      isDark ? 'bg-[#090D16] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Top Filter and Controls Bar */}
      <div className={`p-3 border-b flex flex-wrap items-center justify-between gap-3 z-10 transition-colors ${
        isDark ? 'bg-[#0D111B]/90 border-slate-800' : 'bg-slate-50/90 border-slate-200'
      }`}>
        <div className="flex items-center space-x-2">
          {/* Endpoint Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Highlight IP..."
              className={`pl-8 pr-3 py-1 border rounded-lg text-xs font-mono focus:outline-none focus:border-cyan-500 w-44 transition-colors ${
                isDark 
                  ? 'bg-slate-900 border-slate-700/80 text-slate-200 placeholder-slate-500' 
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Protocol Filter */}
          <select
            value={protocolFilter}
            onChange={e => setProtocolFilter(e.target.value)}
            className={`px-2 py-1 border rounded-lg text-xs font-mono focus:outline-none transition-colors ${
              isDark 
                ? 'bg-slate-900 border-slate-700/80 text-slate-300' 
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">All Protocols</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="HTTPS">HTTPS</option>
            <option value="HTTP">HTTP</option>
            <option value="DNS">DNS</option>
            <option value="SSH">SSH</option>
            <option value="SMB">SMB</option>
          </select>

          {/* Subnet cluster toggle */}
          <button
            onClick={() => setShowSubnetClusters(!showSubnetClusters)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              showSubnetClusters 
                ? (isDark ? 'bg-cyan-950/40 border-cyan-800 text-cyan-300' : 'bg-cyan-50 border-cyan-300 text-cyan-800 font-bold') 
                : (isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600')
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Subnet Clusters</span>
          </button>
        </div>

        {/* Viewport Zoom & Reset Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setZoom(prev => Math.min(3.5, prev * 1.2))}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.3, prev * 0.8))}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {/* Graph Legend Overlay */}
        <div className={`absolute bottom-3 left-3 p-3 rounded-xl backdrop-blur-md text-xs font-mono space-y-1.5 pointer-events-none border ${
          isDark 
            ? 'bg-slate-950/80 border-slate-800/80 text-slate-400' 
            : 'bg-white/90 border-slate-200 text-slate-600 shadow-md'
        }`}>
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Topology Legend</div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full border border-rose-500 bg-rose-500" />
            <span>Critical Alert Node</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full border border-amber-500 bg-amber-500" />
            <span>High Severity Alert</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full border ${isDark ? 'border-cyan-500 bg-slate-900' : 'border-sky-500 bg-sky-100'}`} />
            <span>Internal Host</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full border ${isDark ? 'border-slate-500 bg-slate-900' : 'border-slate-400 bg-slate-100'}`} />
            <span>External WAN Host</span>
          </div>
        </div>

        {/* Selected Node Inspector Drawer */}
        {selectedNode && (
          <div className={`absolute top-3 right-3 w-80 rounded-xl shadow-2xl p-4 backdrop-blur-md space-y-3 animate-in fade-in slide-in-from-right-4 z-20 border ${
            isDark ? 'bg-[#111827]/95 border-slate-700/80 text-white' : 'bg-white/95 border-slate-200 text-slate-900 shadow-xl'
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center space-x-2">
                {selectedNode.isExternal ? <Globe className="w-4 h-4 text-slate-400" /> : <Laptop className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
                <span className={`font-mono font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedNode.ip}</span>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className={`p-2 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] text-slate-400">Total Flows</div>
                <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedNode.totalFlows}</div>
              </div>
              <div className={`p-2 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] text-slate-400">Subnet</div>
                <div className="text-cyan-600 dark:text-cyan-400 truncate">{selectedNode.subnet}</div>
              </div>
              <div className={`p-2 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] text-slate-400">Sent Volume</div>
                <div className={isDark ? 'text-slate-200' : 'text-slate-800'}>{(selectedNode.bytesOut / 1024).toFixed(1)} KB</div>
              </div>
              <div className={`p-2 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] text-slate-400">Recv Volume</div>
                <div className={isDark ? 'text-slate-200' : 'text-slate-800'}>{(selectedNode.bytesIn / 1024).toFixed(1)} KB</div>
              </div>
            </div>

            {/* Ports observed */}
            <div className="text-xs">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                Observed Ports ({selectedNode.ports.size})
              </span>
              <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                {Array.from(selectedNode.ports).slice(0, 8).map(port => (
                  <span key={port} className={`px-1.5 py-0.5 rounded border ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    :{port}
                  </span>
                ))}
                {selectedNode.ports.size > 8 && (
                  <span className="text-slate-400 text-[10px]">+{selectedNode.ports.size - 8} more</span>
                )}
              </div>
            </div>

            {/* Associated Alerts */}
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                Associated Alerts ({selectedNode.alerts.length})
              </span>
              {selectedNode.alerts.length === 0 ? (
                <div className="text-xs text-slate-400 italic">No anomaly alerts on this device.</div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedNode.alerts.map(a => (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAlert(a)}
                      className={`p-2 rounded border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                        isDark 
                          ? 'bg-slate-900/80 hover:bg-slate-850 border-slate-800' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <div className="font-mono text-cyan-600 dark:text-cyan-400 font-bold text-[11px]">{a.id}</div>
                        <div className={`truncate text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{a.title}</div>
                      </div>
                      <SeverityBadge severity={a.severity} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Edge Inspector Drawer */}
        {selectedEdge && (
          <div className={`absolute top-3 right-3 w-80 rounded-xl shadow-2xl p-4 backdrop-blur-md space-y-3 animate-in fade-in slide-in-from-right-4 z-20 border ${
            isDark ? 'bg-[#111827]/95 border-slate-700/80 text-white' : 'bg-white/95 border-slate-200 text-slate-900 shadow-xl'
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`font-mono font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>Communication Channel</span>
              <button onClick={() => setSelectedEdge(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-2.5 rounded border text-xs font-mono space-y-1 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-slate-400">Source: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{selectedEdge.source}</strong></div>
              <div className="text-slate-400">Destination: <strong className="text-cyan-600 dark:text-cyan-400">{selectedEdge.destination}</strong></div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className={`p-2 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] text-slate-400">Flow Count</div>
                <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedEdge.flowCount}</div>
              </div>
              <div className={`p-2 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] text-slate-400">Total Bytes</div>
                <div className={isDark ? 'text-slate-200' : 'text-slate-800'}>{(selectedEdge.totalBytes / 1024).toFixed(1)} KB</div>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Protocols</span>
              <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                {Array.from(selectedEdge.protocols).map(p => (
                  <span key={p} className={`px-1.5 py-0.5 rounded border ${
                    isDark ? 'bg-slate-800 text-cyan-300 border-slate-700' : 'bg-cyan-50 text-cyan-800 border-cyan-200 font-semibold'
                  }`}>
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {selectedEdge.alerts.length > 0 && (
              <div>
                <span className="text-[10px] font-mono uppercase text-rose-500 font-bold block mb-1">
                  Alerts on Link ({selectedEdge.alerts.length})
                </span>
                <div className="space-y-1">
                  {selectedEdge.alerts.map(a => (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAlert(a)}
                      className={`p-1.5 rounded border text-xs cursor-pointer transition-colors ${
                        isDark 
                          ? 'bg-rose-950/40 border-rose-800/40 text-rose-300 hover:bg-rose-900/50' 
                          : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                      }`}
                    >
                      {a.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
