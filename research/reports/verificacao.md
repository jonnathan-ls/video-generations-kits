# Estado da entrega · 5 de novembro de 2026

## Kit operado pelo chat

- O kit está em `kit/` e as sete skills têm nomes funcionais sem prefixo de marca. O README e o AGENTS orientam a LLM a operar os arquivos e ferramentas; as únicas decisões delegadas ao criador são validações e aprovações.
- O catálogo contém 98 recursos. As decisões feitas pelo usuário são persistidas por recurso e variação; o agente não concede essas aprovações. Consulte os estados atuais na aplicação, pois podem mudar após este registro.
- A narrativa de demonstração foi analisada palavra a palavra, incluindo verbos, câmera e efeito. O plano contém sete necessidades de onze categorias possíveis; a aplicação mostra o estado atual de cada uma.
- A aplicação distingue catálogo aprovado, catálogo pendente e recursos novos da narrativa. Possui inspeção de câmera, escala, giro, corte, parte/hierarquia, isolamento, limites, clay/normais, ortográfica e gizmo. A lista por vídeo tem validação própria, separada da aprovação individual de cada recurso.
- O pipeline HyperFrames permanece como saída de produção; a construção final continua condicionada aos recursos aprovados, à voz e às escolhas criativas do autor. Nenhum vídeo final de publicação foi produzido.

## Pesquisa

- Foram coletados sete Shorts do RicksClips3000, com transcrições Whisper, vídeo vertical 1080×1920, quadros de contato e medidas de duração/ritmo/áudio. A análise está em `ricks.md`; a aplicação lê os dados estruturados de `ricks.json`.
- Os outros seis vídeos de referência e suas análises permanecem no relatório inicial `analise.md`.
- Foram adicionados sete Reels do HiddenHome com transcrições, quadros e análise em `hiddenhome.md`; esses insumos são consultados pela LLM.
- Os títulos, contagens e identificadores representam o momento de coleta. Views não comprovam retenção ou precisão factual. Afirmações históricas, médicas, legais e de engenharia ainda precisam de fontes independentes antes de um roteiro factual.

## Segurança e validação

- O clone oficial Three.js foi inspecionado sem executar seu servidor/editor. O relatório registra limites do servidor e execução de scripts importados. A auditoria NPM do clone encontrou oito vulnerabilidades de desenvolvimento (seis moderadas, duas baixas); produção do kit: zero em três dependências reportadas.
- A aplicação local foi conferida com a lista de sete necessidades do estudo e os estados reais atuais. A junta foi exibida e seus modos ortográfico, clay, gizmo local, seleção/isolamento de peça, limites e corte por eixo foram acionados. A inspeção não gravou essas mudanças na geometria.
- A suíte automatizada executada durante esta entrega passou em 13 testes. As skills modificadas passaram pelo validador. O gerador geométrico aceita somente objetos, personagens e cenários; os demais tipos seguem contratos especializados.

O estúdio local continua disponível em http://127.0.0.1:4173. A LLM administra seu ciclo de vida; o usuário não precisa executar comandos.
