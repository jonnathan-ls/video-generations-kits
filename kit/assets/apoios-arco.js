import {createResource} from '../engine/factory/index.js';
const recipe={
  "id": "apoios_arco",
  "parts": [
    {
      "id": "encontro_esquerdo",
      "shape": "box",
      "size": [
        1.1,
        1.93,
        0.62
      ],
      "position": [
        -2.38,
        1.185,
        0
      ],
      "material": {
        "surface": "concrete",
        "color": "#b6aaa0"
      }
    },
    {
      "id": "sapata_esquerdo",
      "shape": "box",
      "size": [
        1.1,
        0.22,
        0.62
      ],
      "position": [
        -2.38,
        0.11,
        0
      ],
      "material": {
        "surface": "concrete",
        "color": "#958a81"
      }
    },
    {
      "id": "encontro_direito",
      "shape": "box",
      "size": [
        1.1,
        1.93,
        0.62
      ],
      "position": [
        2.38,
        1.185,
        0
      ],
      "material": {
        "surface": "concrete",
        "color": "#b6aaa0"
      }
    },
    {
      "id": "sapata_direito",
      "shape": "box",
      "size": [
        1.1,
        0.22,
        0.62
      ],
      "position": [
        2.38,
        0.11,
        0
      ],
      "material": {
        "surface": "concrete",
        "color": "#958a81"
      }
    }
  ]
};
export const create=options=>createResource(recipe,options);
