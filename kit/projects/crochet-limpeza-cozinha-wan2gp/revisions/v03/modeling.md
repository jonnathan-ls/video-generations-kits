# Modelagem — revisão 03

## Objetivo

Fazer um Short vertical de aproximadamente 29,4 segundos sobre a limpeza de uma cozinha miniatura de crochê. A referência orienta sequência, ações e ritmo de cortes. O vídeo final deve ser uma criação nova, sem copiar quadros nem áudio do Reel.

## Direção que segue para produção

Manter a progressão observada: louça na pia, recipiente, cooktop, migalhas no piso, limpeza e organização da geladeira, despensa, retoques finais e revelação da cozinha limpa. Preservar os cortes rápidos nos limites mapeados e usar inserts somente quando mostram contato ou resultado distinto. Cada beat fica preso à sua ação, estado inicial/final e intenção sonora em `beats.json`.

O estilo de crochê é o foco visual: fio de algodão fosco, laçadas grandes e legíveis, relevo contínuo nas superfícies e nos utensílios, escala de pontos constante e água/espuma/migalhas visualmente separadas. A paleta proposta está em `style-bible.json`; é uma direção criativa revisável, não evidência de qualidade já alcançada.

## Método de geração

Os quadros serão gerados com modelos locais do Wan2GP. A estratégia proposta é produzir âncoras inicial/final com IA local e animar cada ação com um modelo I2V nativo. A própria referência não será usada como entrada. Não usar Three.js, cenas determinísticas, guias renderizadas por código ou assets JavaScript para compor o visual.

O lote anterior com `t2v_nexus_1.3B` foi reprovado, portanto não será simplesmente repetido com mais adjetivos. O repositório confirma que o Qwen Image 2.1 Turbo está configurado como ferramenta local de imagem, e o upstream do Wan2GP oferece `fun_inp_1.3B` para animação de quadros inicial/final. Os pesos e parâmetros nativos desses candidatos não constam no lock atual; precisam ser verificados e fixados antes de qualquer inferência. Não alegar que a consistência está resolvida pelo plano escrito.

## QA e limite da etapa

O primeiro artefato que o criador revisará é um clipe de prova do primeiro beat. O revisor inspecionará todos os frames a 10 fps, o movimento em preparação/contato/reação/resultado e a leitura em escala de celular. Textura inconsistente, ação trocada, contato falso, falha de continuidade, ritmo sem payoff ou áudio desalinhado reprovam o clipe e devolvem o trabalho à modelagem/prompt. Nenhum render final será iniciado antes de o gancho passar.

Não há decisão preliminar nem lista de assets 3D para aprovar. A revisão estética relevante será do primeiro clipe Wan2GP. Nenhuma chamada à GPU foi feita; a geração fica para depois que a RTX estiver livre.
