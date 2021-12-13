const fs = require('fs');
const { promisify } = require('util');

const readFilePromise = promisify(fs.readFile);

//Obtenemos la ruta mas larga
const getMaxPath = (parent, vertices, edges, INDEX_MAPS) => {
    const selectedEdges = INDEX_MAPS.EDGE_FROM[parent.id].map(eIdx => edges[eIdx]);
    const childNodes = selectedEdges.map(e => vertices[INDEX_MAPS.VERTEX[e.to]]);
    let maxPath = [parent];
    if (childNodes.length > 0) { // not a leaf node
        const maxPaths = childNodes.map(c => getMaxPath(c, vertices, edges, INDEX_MAPS));
        const maxLen = Math.max(...maxPaths.map(m => m.length));
        const filteredMaxPaths = maxPaths.filter(m => m.length === maxLen);

        if (filteredMaxPaths.length > 0) {
            const maxDepth = Math.max(...filteredMaxPaths.map(m => parent.value - m[m.length - 1].value));
            const m = filteredMaxPaths.find(m => (parent.value - m[m.length - 1].value) === maxDepth);
            maxPath = maxPath.concat(m);
        } else {
            maxPath = maxPath.concat(filteredMaxPaths[0]);
        }
    }
    return maxPath;
}

const executeMap = async mapFilePath => {
    const INDEX_MAPS = {
        VERTEX: {},
        EDGE_FROM: {}
    };

    //Variables para la verificacion de coordenadas
    const inputs = await readFilePromise(mapFilePath, { encoding: 'utf8' });
    const inputRows = inputs.split('\n');
    const [rows, cols] = inputRows.shift().split(' ').map(n => Number(n));
    const inputMap = inputRows.slice(0, rows).map(r => r.split(' ').map(n => Number(n)));
    const vertices = [];

    const edges = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const currentVertexId = `r${r}_c${c}`;
            const currentVertexValue = inputMap[r][c];

            //Verificacion de las celdas contiguas
            const north = (r > 0) ? { id: `r${r - 1}_c${c}`, value: inputMap[r - 1][c] } : undefined;
            const west = (c > 0) ? { id: `r${r}_c${c - 1}`, value: inputMap[r][c - 1] } : undefined;
            const east = (c < cols - 1) ? { id: `r${r}_c${c + 1}`, value: inputMap[r][c + 1] } : undefined;
            const south = (r < rows - 1) ? { id: `r${r + 1}_c${c}`, value: inputMap[r + 1][c] } : undefined;

            const definedNeighbors = [north, east, west, south].filter(n => typeof n !== 'undefined');
            const validPathsFromCurrentVertex = definedNeighbors.filter(n => n.value < currentVertexValue);
            const validPathsToCurrentVertex = definedNeighbors.filter(n => n.value >= currentVertexValue);

            // Almacenar los vertices
            vertices.push({
                id: currentVertexId,
                value: currentVertexValue,
                isSource: !validPathsToCurrentVertex.length
            });
            INDEX_MAPS.VERTEX[currentVertexId] = vertices.length - 1;
            INDEX_MAPS.EDGE_FROM[currentVertexId] = [];
            
            // Almacenar los bordes
            validPathsFromCurrentVertex.forEach(p => {
                edges.push({
                    from: currentVertexId,
                    to: p.id
                });
                INDEX_MAPS.EDGE_FROM[currentVertexId].push(edges.length - 1);
            })
        }
    }

    const sourceVertices = vertices.filter(v => v.isSource);
    const maxPaths = sourceVertices.map(v => getMaxPath(v, vertices, edges, INDEX_MAPS));

    // Verificar rutas por su largo
    let maxPathLen = 0;
    maxPaths.forEach(m => {
        maxPathLen = m.length > maxPathLen ? m.length : maxPathLen;
    });
    const maxPathsFilteredByLen = maxPaths.filter(m => m.length === maxPathLen)

    // Verificar rutas por inclinacion
    let maxDepth = 0;
    maxPathsFilteredByLen.forEach(m => {
        const start = m[0].value;
        const end = m[m.length - 1].value;
        const depth = start - end;
        maxDepth = depth > maxDepth ? depth : maxDepth;
    });

    //Registrar la ruta mas larga e inclinada
    const maxPathsFilteredByLenAndDepth = maxPathsFilteredByLen.filter(m => (m[0].value - m[m.length - 1].value) === maxDepth)
    
    console.log('');
    console.log(`Longitud de la ruta: ${maxPathLen}`);
    console.log(`Inclinación de la ruta: ${maxDepth}`);
    console.log('');

    //Recorrido de las coordenadas encontradas en la ruta
    maxPathsFilteredByLenAndDepth.map((maxPath) => {
        console.log('Ruta encontrada: ', maxPath.map(m => `[${m.value}]`).join('-'));
    })
}

executeMap('./map.txt');
//executeMap('./sample_map.txt');
