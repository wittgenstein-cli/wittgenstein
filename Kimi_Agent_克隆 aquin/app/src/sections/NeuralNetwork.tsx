import { useRef } from 'react';

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  color?: string;
  percentage?: string;
  isOutput?: boolean;
}

const inputNodes: Node[] = [
  { id: 'tok', x: 50, y: 80, label: 'tok' },
  { id: 'pos', x: 50, y: 160, label: 'pos' },
  { id: 'emb', x: 50, y: 240, label: 'emb' },
];

const layerNodes: Node[] = [
  // Column 1
  { id: 'L0', x: 180, y: 60, label: 'L0' },
  { id: 'L1', x: 180, y: 130, label: 'L1' },
  { id: 'L2', x: 180, y: 200, label: 'L2' },
  { id: 'L3', x: 180, y: 270, label: 'L3' },
  // Column 2
  { id: 'L4', x: 320, y: 60, label: 'L4' },
  { id: 'L5', x: 320, y: 130, label: 'L5' },
  { id: 'L6', x: 320, y: 200, label: 'L6' },
  { id: 'L7', x: 320, y: 270, label: 'L7', color: '#FDE68A', percentage: '23%' },
  // Column 3
  { id: 'L8', x: 460, y: 60, label: 'L8', color: '#FCA5A5', percentage: '49%' },
  { id: 'L9', x: 460, y: 130, label: 'L9', color: '#FECACA', percentage: '65%' },
  { id: 'L10', x: 460, y: 200, label: 'L10', color: '#FCA5A5', percentage: '52%' },
  { id: 'L11', x: 460, y: 270, label: 'L11', color: '#FECACA', percentage: '48%' },
  // Column 4
  { id: 'L12', x: 600, y: 60, label: 'L12', color: '#FDE68A', percentage: '21%' },
  { id: 'L13', x: 600, y: 130, label: 'L13' },
  { id: 'L14', x: 600, y: 200, label: 'L14' },
  { id: 'L15', x: 600, y: 270, label: 'L15' },
];

const outputNode: Node = { id: 'out', x: 730, y: 160, label: 'out', color: '#86EFAC', isOutput: true };

export default function NeuralNetwork() {
  const svgRef = useRef<SVGSVGElement>(null);

  const allNodes = [...inputNodes, ...layerNodes, outputNode];

  const getConnections = () => {
    const connections: { from: Node; to: Node }[] = [];
    // Input to first layer
    inputNodes.forEach((input) => {
      layerNodes.slice(0, 4).forEach((layer) => {
        connections.push({ from: input, to: layer });
      });
    });
    // Between layer columns
    for (let col = 0; col < 3; col++) {
      const fromStart = col * 4;
      const toStart = (col + 1) * 4;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          connections.push({
            from: layerNodes[fromStart + i],
            to: layerNodes[toStart + j],
          });
        }
      }
    }
    // Last layer to output
    layerNodes.slice(12, 16).forEach((layer) => {
      connections.push({ from: layer, to: outputNode });
    });
    return connections;
  };

  const connections = getConnections();

  return (
    <div className="flex justify-center py-8">
      <svg
        ref={svgRef}
        viewBox="0 0 800 340"
        className="w-full max-w-4xl"
        style={{ overflow: 'visible' }}
      >
        {/* Connection lines */}
        {connections.map((conn, i) => (
          <line
            key={i}
            x1={conn.from.x + 20}
            y1={conn.from.y + 20}
            x2={conn.to.x + 20}
            y2={conn.to.y + 20}
            stroke="#E5E7EB"
            strokeWidth="1"
            opacity="0.6"
          />
        ))}

        {/* Nodes */}
        {allNodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x + 20}
              cy={node.y + 20}
              r={node.isOutput ? 24 : 20}
              fill={node.color || (inputNodes.includes(node) ? '#374151' : '#F9FAFB')}
              stroke={node.color ? 'none' : '#E5E7EB'}
              strokeWidth="1"
              className={node.color ? '' : ''}
            />
            <text
              x={node.x + 20}
              y={node.y + 20}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-xs font-mono"
              fill={node.color || inputNodes.includes(node) ? '#000' : '#6B7280'}
              fontSize="11"
            >
              {node.label}
            </text>
            {node.percentage && (
              <text
                x={node.x + 20}
                y={node.y - 8}
                textAnchor="middle"
                className="text-xs font-mono"
                fill="#6B7280"
                fontSize="10"
              >
                {node.percentage}
              </text>
            )}
          </g>
        ))}

        {/* Output label */}
        <text
          x={outputNode.x + 54}
          y={outputNode.y + 20}
          textAnchor="start"
          dominantBaseline="central"
          className="text-sm font-mono"
          fill="#6B7280"
          fontSize="12"
        >
          Paris
        </text>
      </svg>
    </div>
  );
}
