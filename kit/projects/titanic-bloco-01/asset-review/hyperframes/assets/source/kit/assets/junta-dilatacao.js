import {createResource} from '../engine/factory/index.js';
const recipe={
  "id": "junta_dilatacao",
  "parts": [
    {
      "id": "dormente--1.8",
      "shape": "box",
      "size": [
        0.22,
        0.18,
        1.75
      ],
      "position": [
        -1.8,
        0.09,
        0
      ],
      "material": {
        "surface": "wood"
      }
    },
    {
      "id": "dormente--0.9",
      "shape": "box",
      "size": [
        0.22,
        0.18,
        1.75
      ],
      "position": [
        -0.9,
        0.09,
        0
      ],
      "material": {
        "surface": "wood"
      }
    },
    {
      "id": "dormente-0",
      "shape": "box",
      "size": [
        0.22,
        0.18,
        1.75
      ],
      "position": [
        0,
        0.09,
        0
      ],
      "material": {
        "surface": "wood"
      }
    },
    {
      "id": "dormente-0.9",
      "shape": "box",
      "size": [
        0.22,
        0.18,
        1.75
      ],
      "position": [
        0.9,
        0.09,
        0
      ],
      "material": {
        "surface": "wood"
      }
    },
    {
      "id": "dormente-1.8",
      "shape": "box",
      "size": [
        0.22,
        0.18,
        1.75
      ],
      "position": [
        1.8,
        0.09,
        0
      ],
      "material": {
        "surface": "wood"
      }
    },
    {
      "id": "base--1--0.55",
      "shape": "box",
      "size": [
        1.92,
        0.1,
        0.19
      ],
      "position": [
        -1.02,
        0.235,
        -0.55
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "alma--1--0.55",
      "shape": "box",
      "size": [
        1.92,
        0.24,
        0.065
      ],
      "position": [
        -1.02,
        0.39,
        -0.55
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "cabeca--1--0.55",
      "shape": "box",
      "size": [
        1.92,
        0.11,
        0.14
      ],
      "position": [
        -1.02,
        0.565,
        -0.55
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "tala--1--0.55--0.075",
      "shape": "box",
      "size": [
        0.4,
        0.15,
        0.035
      ],
      "position": [
        -0.23,
        0.39,
        -0.625
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "tala--1--0.55-0.075",
      "shape": "box",
      "size": [
        0.4,
        0.15,
        0.035
      ],
      "position": [
        -0.23,
        0.39,
        -0.47500000000000003
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "base-1--0.55",
      "shape": "box",
      "size": [
        1.92,
        0.1,
        0.19
      ],
      "position": [
        1.02,
        0.235,
        -0.55
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "alma-1--0.55",
      "shape": "box",
      "size": [
        1.92,
        0.24,
        0.065
      ],
      "position": [
        1.02,
        0.39,
        -0.55
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "cabeca-1--0.55",
      "shape": "box",
      "size": [
        1.92,
        0.11,
        0.14
      ],
      "position": [
        1.02,
        0.565,
        -0.55
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "tala-1--0.55--0.075",
      "shape": "box",
      "size": [
        0.4,
        0.15,
        0.035
      ],
      "position": [
        0.23,
        0.39,
        -0.625
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "tala-1--0.55-0.075",
      "shape": "box",
      "size": [
        0.4,
        0.15,
        0.035
      ],
      "position": [
        0.23,
        0.39,
        -0.47500000000000003
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "parafuso--0.55--0.32",
      "shape": "cylinder",
      "size": [
        0.026,
        0.22,
        1
      ],
      "position": [
        -0.32,
        0.39,
        -0.55
      ],
      "rotation": [
        90,
        0,
        0
      ],
      "material": {
        "surface": "metal",
        "color": "#c0c6c9",
        "metalness": 0.6
      }
    },
    {
      "id": "parafuso--0.55--0.13",
      "shape": "cylinder",
      "size": [
        0.026,
        0.22,
        1
      ],
      "position": [
        -0.13,
        0.39,
        -0.55
      ],
      "rotation": [
        90,
        0,
        0
      ],
      "material": {
        "surface": "metal",
        "color": "#c0c6c9",
        "metalness": 0.6
      }
    },
    {
      "id": "parafuso--0.55-0.13",
      "shape": "cylinder",
      "size": [
        0.026,
        0.22,
        1
      ],
      "position": [
        0.13,
        0.39,
        -0.55
      ],
      "rotation": [
        90,
        0,
        0
      ],
      "material": {
        "surface": "metal",
        "color": "#c0c6c9",
        "metalness": 0.6
      }
    },
    {
      "id": "parafuso--0.55-0.32",
      "shape": "cylinder",
      "size": [
        0.026,
        0.22,
        1
      ],
      "position": [
        0.32,
        0.39,
        -0.55
      ],
      "rotation": [
        90,
        0,
        0
      ],
      "material": {
        "surface": "metal",
        "color": "#c0c6c9",
        "metalness": 0.6
      }
    },
    {
      "id": "base--1-0.55",
      "shape": "box",
      "size": [
        1.92,
        0.1,
        0.19
      ],
      "position": [
        -1.02,
        0.235,
        0.55
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "alma--1-0.55",
      "shape": "box",
      "size": [
        1.92,
        0.24,
        0.065
      ],
      "position": [
        -1.02,
        0.39,
        0.55
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "cabeca--1-0.55",
      "shape": "box",
      "size": [
        1.92,
        0.11,
        0.14
      ],
      "position": [
        -1.02,
        0.565,
        0.55
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "tala--1-0.55--0.075",
      "shape": "box",
      "size": [
        0.4,
        0.15,
        0.035
      ],
      "position": [
        -0.23,
        0.39,
        0.47500000000000003
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "tala--1-0.55-0.075",
      "shape": "box",
      "size": [
        0.4,
        0.15,
        0.035
      ],
      "position": [
        -0.23,
        0.39,
        0.625
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "base-1-0.55",
      "shape": "box",
      "size": [
        1.92,
        0.1,
        0.19
      ],
      "position": [
        1.02,
        0.235,
        0.55
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "alma-1-0.55",
      "shape": "box",
      "size": [
        1.92,
        0.24,
        0.065
      ],
      "position": [
        1.02,
        0.39,
        0.55
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "cabeca-1-0.55",
      "shape": "box",
      "size": [
        1.92,
        0.11,
        0.14
      ],
      "position": [
        1.02,
        0.565,
        0.55
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "tala-1-0.55--0.075",
      "shape": "box",
      "size": [
        0.4,
        0.15,
        0.035
      ],
      "position": [
        0.23,
        0.39,
        0.47500000000000003
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "tala-1-0.55-0.075",
      "shape": "box",
      "size": [
        0.4,
        0.15,
        0.035
      ],
      "position": [
        0.23,
        0.39,
        0.625
      ],
      "material": {
        "surface": "metal"
      }
    },
    {
      "id": "parafuso-0.55--0.32",
      "shape": "cylinder",
      "size": [
        0.026,
        0.22,
        1
      ],
      "position": [
        -0.32,
        0.39,
        0.55
      ],
      "rotation": [
        90,
        0,
        0
      ],
      "material": {
        "surface": "metal",
        "color": "#c0c6c9",
        "metalness": 0.6
      }
    },
    {
      "id": "parafuso-0.55--0.13",
      "shape": "cylinder",
      "size": [
        0.026,
        0.22,
        1
      ],
      "position": [
        -0.13,
        0.39,
        0.55
      ],
      "rotation": [
        90,
        0,
        0
      ],
      "material": {
        "surface": "metal",
        "color": "#c0c6c9",
        "metalness": 0.6
      }
    },
    {
      "id": "parafuso-0.55-0.13",
      "shape": "cylinder",
      "size": [
        0.026,
        0.22,
        1
      ],
      "position": [
        0.13,
        0.39,
        0.55
      ],
      "rotation": [
        90,
        0,
        0
      ],
      "material": {
        "surface": "metal",
        "color": "#c0c6c9",
        "metalness": 0.6
      }
    },
    {
      "id": "parafuso-0.55-0.32",
      "shape": "cylinder",
      "size": [
        0.026,
        0.22,
        1
      ],
      "position": [
        0.32,
        0.39,
        0.55
      ],
      "rotation": [
        90,
        0,
        0
      ],
      "material": {
        "surface": "metal",
        "color": "#c0c6c9",
        "metalness": 0.6
      }
    }
  ]
};
export const create=options=>createResource(recipe,options);
