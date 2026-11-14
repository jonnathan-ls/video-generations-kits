# Modelagem e fluxo — revisão 02

## Objetivo

Criar uma peça vertical original, sem fala, sobre a limpeza e a organização de uma cozinha miniatura de crochê. A referência define a ordem das ações e o ritmo; não fornece quadros, áudio, personagens, cores ou desenho de cozinha para o modelo. A textura deve ser reconhecível em todas as superfícies têxteis e permanecer estável durante contato, movimento e corte.

## O que a análise a 10 fps mostra

Os 294 quadros extraídos cobrem 29,375 s. A sequência progride de louça na pia para fogão, migalhas no chão, limpeza e reposição da geladeira, organização da despensa, retoques e plano geral final. Os limites principais foram agrupados perto de 3,65; 6,92; 10,77; 14,02; 17,36; 19,89; 22,25; 23,80; 25,20; 26,78 e 27,97 s. Há inserts internos, sobretudo durante o fogão, a varrida, a geladeira e a organização dos armários.

Os tempos são aproximações da amostra e da inspeção visual; a lista de diferenças do FFmpeg é apenas candidata a corte. Ela também reage a mãos, objetos e transformações. `beats.json` separa limites observados de inserts propostos para a nova peça.

## Diagnóstico do lote anterior

O lote anterior transformou cada beat num T2V sem imagem ou guia comum. Um prefixo de texto e sementes fixas não mantiveram a cozinha nem o material. Nas folhas a 10 fps, o primeiro prato tem pontos de crochê sobre uma bancada e piso com aparência lisa/de madeira; a geladeira muda de layout e o beat 05 vira a retirada de um tapete; no beat 10 a ação é pousar uma panela, sem a passada final de pano; o plano geral final não recompõe a cozinha do gancho. A abertura não mostra o enxágue/espuma que o plano prometia.

O áudio anterior também seguiu os clips errados: há cue que descreve varrer um tapete. A revisão 01 está, portanto, reprovada como imagem e como base de sincronismo. Sua montagem final não foi feita. A revisão 02 não reutiliza o áudio, as imagens ou os prompts antigos como solução.

## Método novo

1. Construir uma única cozinha-guia no sistema local de cenas do kit. A planta, escala, luz, materiais, adereços e pontos de apoio ficam determinísticos. A trama de crochê entra na guia como estrutura repetível, com laçadas grandes o bastante para sobreviver ao quadro 432×768; não depender de um adjetivo no prompt para criar a textura.
2. Encadear os 12 beats na mesma cozinha. Os inserts mudam o alvo e a escala, mas retornam à mesma geometria. Água, espuma e migalhas só aparecem onde a ação as produz. Mãos humanas entram apenas para executar os contatos.
3. Depois de revisão da lista de recursos e disponibilidade/autorização da GPU, renderizar somente a guia e um teste Wan2GP do beat 01. O modo planejado é `GUV` com `denoising_strength: 0.1`, usando o guia como fonte de movimento e composição. Essa escolha parte do procedimento já documentado em `kit/docs/wan2gp.md`; ela ainda não foi testada em materiais têxteis.
4. Revisar o teste em movimento, a 10 fps, em resolução original e em escala de celular. Se a trama perder definição, se o modelo mudar materiais/objetos ou se o contato se desviar, reprovar e corrigir a guia ou trocar a abordagem. Não aumentar o lote para mascarar a falha.
5. Só depois de o gancho passar, preparar e gerar os demais beats. Ao final, remontar os tempos, ajustar o som aos contatos realmente visíveis e revisar o filme inteiro, incluindo cortes vizinhos, antes de qualquer entrega.

O guia precisa carregar o visual, porque o checkpoint fixado para este projeto é `t2v_nexus_1.3B`, um T2V de 432×768. O lock local não registra um checkpoint I2V para esta produção. O upstream aceita o modo `GUV`; o valor 0,1 é apenas ponto inicial, não garantia de estilo, continuidade ou qualidade.

## Direção original

Manter uma cozinha miniatura em L, com a pia à esquerda, o fogão à direita e geladeira/despensa no mesmo fundo. A paleta proposta é azul-petróleo, creme amanteigado, verde-sálvia e coral queimado; ela se afasta da combinação cromática da referência. As superfícies, puxadores, louças, utensílios e eletrodomésticos visíveis são de fio de algodão, com variação de ponto conforme função. Mãos humanas sem acessórios e água/espuma transparentes são as exceções materiais deliberadas.

Os cortes seguem a mudança real de tarefa ou do detalhe que precisa ser lido. Abertura começa com a ação já em curso; o plano geral fica reservado para o pagamento final. Não haverá texto, UI, legenda ou marca técnica nos pixels.

## Som

Sem voz. A proposta usa foley original de água, tecido, cerdas, recipientes macios e contato dos utensílios, mais uma trilha instrumental leve, com pausas e acentos nos retornos. A trilha e os FX do Reel não foram ouvidos; nenhum timbre ou sincronismo da referência é alegado. A mixagem anterior permanece fora desta revisão. O áudio novo só será montado quando os movimentos forem reais e precisa de escuta crítica.

## Limite e decisão pendente

Esta revisão não possui guia visual renderizado, imagem âncora, clip de teste ou montagem. Logo, sua aparência, movimento, textura e som estão `not-verified`; a revisão profissional do vídeo ainda não pode ser emitida. O plano e o backlog precisam ser validados pelo criador antes de construir os recursos. A chamada ao modelo continua bloqueada pela instrução de parar antes da renderização.

