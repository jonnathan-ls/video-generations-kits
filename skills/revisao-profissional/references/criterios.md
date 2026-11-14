# Critérios de direção e acabamento

## Domínios obrigatórios

- `hook`: primeiro quadro relevante; situação reconhecível; alvo legível; pergunta nasce de imagem; cada intervalo desenvolve informação, expectativa ou consequência. Silêncio e espera podem ser deliberados, mas precisam produzir expectativa legível. Escuridão, zoom, piscada e corte rápido não demonstram tensão sozinhos.
- `direction`: encadeamento causal e espacial; promessa e recompensa; sujeito e objetivo quando pertinentes ao gênero; exposição não substitui acontecimento. Sem narração, explicar o que se vê sem recorrer à intenção escrita pelo autor.
- `visual-progression`: cada plano acrescenta evento, evidência, mudança de estado ou payoff ligado à narração. Comparar recorrências de alvo principal, composição e ação pelo longa inteiro. Reprovar qualquer retorno sem função narrativa explícita e diferença perceptível; trocar ângulo, zoom, luz, pose ou legenda não cria novidade por si só.
- `animation`: staging, poses, intenção, peso, contato, timing, spacing, trajetórias, aceleração, acomodação e movimentos secundários pertinentes. Antecipação e exagero obedecem à linguagem escolhida; não impor elasticidade de cartoon a uma reconstrução histórica. Reprovar pés escorregando, poses rígidas involuntárias, flutuação e interpenetrações.
- `art-lighting`: silhueta, proporção, figurino/época, materiais, escala, superfície, apoio e coerência da direção de arte. Simplificação exige desenho intencional; geometria genérica não pode substituir o elemento narrativo. Não exigir fotorrealismo por padrão. A noite preserva informação suficiente para ler a ação.
- `camera-editing`: ponto de vista identificável, eixo, hierarquia, preparação/ação/reação, pausas e transferência de atenção. Movimento revela; câmera não faz o papel da ação ausente. Não prescrever corte a cada N segundos. Mudanças de navio, tempo e lugar são compreensíveis na primeira passagem.
- `fx`: origem, trajetória, volume, interação, contato e dissipação adequados. Distância e escala legíveis; efeito revela a relação sem ocultar o sujeito. Água/névoa/fumaça precisam pertencer ao ambiente, não ser decoração persistente.
- `voice`: escutar pronúncia, prosódia, conectivos, perguntas, respiração e continuidade das tomadas. Revisar nomes próprios. Aprovação de voz não equivale a aprovação de todas as falas.
- `sound`: escutar ambiente, foley, FX, música e mix; perspectiva, material, sincronismo, dinâmica e silêncio apoiam a intenção. Não exigir whoosh em todo corte nem música para disfarçar encenação fraca. Medir stems e mix quando pertinente; medições não identificam instrumentos nem avaliam interpretação.
- `delivery`: arquivo decodificado, áudio presente e sincronizado, início/fim, proporção, legibilidade na tela de destino e reprodução real. HTTP 200 não demonstra que há vídeo visível ou que toca. O endpoint precisa ser acessível no dispositivo pretendido.

## Aplicação ao Titanic v1 (caso negativo, não regra universal)

Abertura de 6–14,411 s: ponto verde pequeno sobre horizonte escuro, sem observador identificável e sem desenvolvimento perceptível da situação. Deve reprovar hook/direction mesmo que shader, câmera e render sejam determinísticos. Planos abertos de navios deslocando-se discretamente não demonstram urgência. Bancos vazios sem relação legível com quem fica não completam a contradição humana.

O critério de correção não é “mais cortes” ou “mais partículas”: é identificar o observador/ponto de vista, perceber o sinal como descoberta e acompanhar uma mudança concreta que sustente a expectativa, preservando a origem do sinal para o desfecho e sem inventar fatos como testemunho.

## Registro mínimo de evidência

Cada check registra status (`pass`, `fail`, `not-verified`), método efetivo, achados e caminhos de evidência. Sons não ouvidos ficam não verificados. Abertura examinada só em stills não pode receber aprovação de ritmo/movimento. Evidências antigas não comprovam correção nova.

O campo scope identifica o recorte: uma abertura aprovada não aprova o longa. O parecer diferencia revisão técnica, QA criativo e decisão humana. Nenhuma contagem de triângulos ou média de notas pode compensar bloqueadores.
