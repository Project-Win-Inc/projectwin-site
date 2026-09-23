export interface Site {
  entity: {
    legalName: string;
    state: string;
    kind: string;
    id: string;
    formed: string;
    agentAddress: string;
  };
  contactEmail: string;
  meta: { title: string; description: string };
  header: { tagline: string };
  hero: { line: string };
  lab: { headline: string; body: string[] };
  product: {
    name: string;
    status: string;
    line: string;
    fact: string;
    links: { appStore: string; play: string; site: string };
  };
  values: { title: string; text: string }[];
  founders: string[];
}

export const site: Site = {
  entity: {
    legalName: 'Project Win LLC',
    state: 'Colorado',
    kind: 'limited liability company',
    id: '20251401400',
    formed: '2025-04-04',
    agentAddress: '1500 N Grant St Ste R, Denver, CO 80203',
  },
  contactEmail: 'hello@projectwin.cloud',
  meta: {
    title: 'Project Win: a product lab in Denver',
    description:
      'Project Win LLC is a two-founder product lab in Denver, Colorado. We solve our own problems and ship the solutions worth sharing. Makers of DreamCatcher.',
  },
  header: { tagline: 'Colorado LLC · est. 2025' },
  hero: {
    line: 'A two-founder product lab in Denver. We solve our own problems, and ship the solutions worth sharing.',
  },
  lab: {
    headline: "Most experiments stay in the lab. That's the point.",
    body: [
      'We build small and fast, and follow whatever sparks curiosity. Most ideas teach us something and stop there.',
      'The few that earn it get built properly, and shipped.',
    ],
  },
  product: {
    name: 'DreamCatcher',
    status: 'Live on iOS and Android',
    line: 'DreamCatcher helps you remember, revisit, and understand your dreams before they fade.',
    fact: 'Lovable hackathon winner',
    links: {
      appStore: 'https://apps.apple.com/us/app/dreamcatcher-ai-journal/id6762375451',
      play: 'https://play.google.com/store/apps/details?id=ai.thedreamcatcher.app',
      site: 'https://www.thedreamcatcher.ai/',
    },
  },
  values: [
    {
      title: 'Be in the lab',
      text: "Play and immersed experimentation are meaningful in themselves, and they're where our best ideas come from.",
    },
    {
      title: 'Solve our own problems, sell the solution',
      text: 'We design for problems we actually have. It makes our own lives better first, and proves the need for anyone who shares it.',
    },
    {
      title: 'Business as art',
      text: 'Each product is a piece of art. We put passion and craft into it, and treat creating as a practice in itself.',
    },
    {
      title: 'Controlled abandon',
      text: 'We give ourselves room to explore and take real risks, with our goals and values in sight.',
    },
    { title: 'Simplicity and elegance', text: 'What we create should make life lighter.' },
  ],
  founders: ['Ian Cross', 'Abb Kapoor'],
};
