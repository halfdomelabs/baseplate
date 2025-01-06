import type { GeneratorOutputMetadata } from '@halfdomelabs/sync';

import fs from 'node:fs/promises';
import path from 'node:path';

const GENERATOR_STEPS_HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cytoscape Graph Visualization</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.30.4/cytoscape.min.js"></script>
  <style>
    #cy {
      width: 100%;
      height: 500px;
      border: 1px solid #ccc;
    }
  </style>
</head>
<body>
  <h1>Graph Visualization</h1>
  <div id="cy"></div>

  <script>
    // Define the graph elements: nodes and edges
    const elements = ELEMENTS;

    // Initialize Cytoscape
    const cy = cytoscape({
      container: document.getElementById('cy'), // Container for the graph

      elements: elements,

      style: [ // Stylesheet for the graph
        {
          selector: 'node',
          style: {
            'background-color': '#0074D9',
            'label': 'data(label)',
            'color': '#fff',
            'text-valign': 'center',
            'text-outline-color': '#0074D9',
            'text-outline-width': 2,
            'width': 50,
            'height': 50,
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#B10DC9',
            'target-arrow-color': '#B10DC9',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'text-rotation': 'autorotate',
            'font-size': 10,
            'color': '#000',
          }
        }
      ],

      layout: {
        name: 'breadthfirst', // Layout algorithm
        directed: true,
        spacingFactor: 10,
      }
    });
  </script>
</body>
</html>
`;

function cleanLabel(id: string): string {
  const regex = /^([^|]+).*?([^:.#]+#[^:.#]+)$/;
  const match = regex.exec(id);
  if (match) {
    return `${match[1]}|${match[2]}`;
  }
  return id;
}

export async function writeGeneratorStepsHtml(
  steps: GeneratorOutputMetadata,
  outputDirectory: string,
): Promise<void> {
  const nodes = steps.generatorStepNodes.map((node) => ({
    data: {
      id: node.id,
      label: node.label ?? cleanLabel(node.id),
    },
  }));
  const edges = steps.generatorStepEdges.map((edge) => ({
    data: {
      source: edge.source,
      target: edge.target,
      id: edge.id,
      label: 'provider',
    },
  }));
  const html = GENERATOR_STEPS_HTML_TEMPLATE.replace(
    'ELEMENTS',
    JSON.stringify([...nodes, ...edges], null, 2),
  );
  await fs.writeFile(
    path.join(outputDirectory, 'baseplate/build/generator-steps.html'),
    html,
  );
}
