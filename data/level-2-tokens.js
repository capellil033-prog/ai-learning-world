'use strict';
AIWorld.levels.push({
  id: 'token-pass', number: 2, title: 'Token Pass', topic: 'Tokens und Context Window',
  environment: 'snow', vehicle: 'snowcat', vehicleName: 'Snowcat', unlockedAfter: 'llm-city',
  color: '#527f9a', position: [690, 300], icon: 'mountain-snow', ready: false,
  intro: 'Transportiere relevanten Kontext über den verschneiten Pass. Deine Ladekapazität ist begrenzt.',
  objectives: ['Tokens erkennen', 'Kontext bewusst auswählen', 'Prompt Caching verstehen'],
  stations: [], summary: [], checkpoints: []
});
