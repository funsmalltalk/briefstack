/**
 * Prof G Daily MBA Topics
 * Each topic maps to a real source file from Omer's Rice MBA OneDrive materials.
 * searchHint = what Claude should search for (real article/video/event)
 */

const BASE = '/Users/omerbiton/Library/CloudStorage/OneDrive-RiceUniversity/Rice MBA';

const topics = [

  // ===== SEMESTER 1: COMPETITIVE STRATEGY =====
  {
    course: 'Competitive Strategy (MGMT 570)',
    concept: "Porter's Five Forces",
    sourceFile: `${BASE}/Semester 1/Competative strategy/mgmt570_class2.pdf`,
    searchHint: 'industry structure disruption Porter five forces recent news 2025',
    shinyboxAngle: 'industrial VR training market - who holds power: the O&G clients, the safety regulators, or new SaaS entrants?',
  },
  {
    course: 'Competitive Strategy (MGMT 570)',
    concept: 'What is Strategy (Porter)',
    sourceFile: `${BASE}/Semester 1/Competative strategy/What is strategy.PDF`,
    searchHint: 'strategy vs tactics business 2025 news company pivot',
    shinyboxAngle: "ShinyBox's real strategy question: premium VR platform or custom services shop - you can't be both",
  },
  {
    course: 'Competitive Strategy (MGMT 570)',
    concept: 'Multi-sided platform strategy',
    sourceFile: `${BASE}/Semester 1/Competative strategy/StrategicDecisionsForMultisidedPlatforms.pdf`,
    searchHint: 'platform business model marketplace 2025 news',
    shinyboxAngle: 'could ShinyBox become a platform? VR content creators + O&G companies + training certifiers',
  },
  {
    course: 'Competitive Strategy (MGMT 570)',
    concept: "Zara's supply chain as competitive advantage",
    sourceFile: `${BASE}/Semester 1/Competative strategy/ZarasSustainabilityDilemma.pdf`,
    searchHint: 'supply chain competitive advantage fast fashion 2025',
    shinyboxAngle: 'ShinyBox delivery speed - how fast can you go from client request to deployed VR training module?',
  },
  {
    course: 'Competitive Strategy (MGMT 570)',
    concept: 'Competitive dynamics: Uber vs Didi winner-take-all',
    sourceFile: `${BASE}/Semester 1/Competative strategy/UberVsDidiTheRaceForChinasRide-hailingMarket.pdf`,
    searchHint: 'winner take all market network effects 2025 tech news',
    shinyboxAngle: 'is industrial VR training winner-take-all? If Motive or Intertek gets to 10 O&G majors first, does ShinyBox lose the market?',
  },
  {
    course: 'Competitive Strategy (MGMT 570)',
    concept: 'Cola Wars: competing on differentiation vs price',
    sourceFile: `${BASE}/Semester 1/Competative strategy/ColaWarsContinueCokeAndPepsiIn2010.pdf`,
    searchHint: 'B2B differentiation pricing battle 2025 SaaS enterprise',
    shinyboxAngle: "ShinyBox's differentiation claim: VR reduces incidents. If you can't prove it with data, you're just competing on price",
  },

  // ===== SEMESTER 1: MARKETING =====
  {
    course: 'Marketing (MGMT 520)',
    concept: 'Aqualisa: selling innovation to a skeptical market',
    sourceFile: `${BASE}/Semester 1/Marketing/AqualisaQuartzSimplyABetterShower.pdf`,
    searchHint: 'B2B sales innovation adoption enterprise 2025',
    shinyboxAngle: "Aqualisa's problem is ShinyBox's problem: a demonstrably better product that nobody buys because the distribution channel doesn't understand it",
  },
  {
    course: 'Marketing (MGMT 520)',
    concept: 'Premium brand launch: Chateau Margaux third wine',
    sourceFile: `${BASE}/Semester 1/Marketing/ChTeauMargauxLaunchingTheThirdWine.pdf`,
    searchHint: 'premium brand new product launch 2025 positioning',
    shinyboxAngle: "ShinyBox's SaaS tier is the 'third wine' - new offering from same brand. The risk: does it cannibalize or expand?",
  },
  {
    course: 'Marketing (MGMT 520)',
    concept: 'Customer segmentation and targeting',
    sourceFile: `${BASE}/Semester 1/Marketing/Class slids`,
    searchHint: 'customer segmentation B2B enterprise targeting 2025',
    shinyboxAngle: "ShinyBox's beachhead: O&G majors vs mid-size operators vs EPC contractors - each needs a different pitch",
  },
  {
    course: 'Marketing (MGMT 520)',
    concept: 'Willingness to pay and value-based pricing',
    sourceFile: `${BASE}/Semester 1/Marketing/Class slids`,
    searchHint: 'willingness to pay enterprise software pricing 2025',
    shinyboxAngle: "VR training WTP: one avoided HSE incident = $500K-$5M. ShinyBox at $100-200K/yr is a rounding error. That's your pitch.",
  },

  // ===== SEMESTER 1: FINANCE =====
  {
    course: 'Finance (MGMT 540)',
    concept: 'DCF valuation: how to value a business',
    sourceFile: `${BASE}/Semester 1/Finance/Corporate Finance.  Ivo Welch.pdf`,
    searchHint: 'startup valuation DCF SaaS 2025 funding round',
    shinyboxAngle: "What is ShinyBox worth if it successfully transitions to SaaS? A 5x ARR multiple vs services = the entire case for the pivot",
  },
  {
    course: 'Finance (MGMT 540)',
    concept: 'Cost of capital and investment decisions',
    sourceFile: `${BASE}/Semester 1/Finance/Corporate Finance.  Ivo Welch.pdf`,
    searchHint: 'capital allocation investment decision making 2025',
    shinyboxAngle: 'every BD deal you close either speeds or slows the SaaS transition - are you bringing in the right type of revenue?',
  },

  // ===== SEMESTER 1: FINANCIAL ACCOUNTING =====
  {
    course: 'Financial Accounting (MGMT 501)',
    concept: 'Revenue recognition and SaaS ARR',
    sourceFile: `${BASE}/Semester 1/Financial Accounting/MGMT 501 Session 13 Slides 2025-2.pptx`,
    searchHint: 'SaaS revenue recognition ARR MRR accounting 2025',
    shinyboxAngle: "When ShinyBox closes a multi-year VR platform deal, how you recognize revenue changes the company's financial story completely",
  },
  {
    course: 'Financial Accounting (MGMT 501)',
    concept: 'Cash flow vs profit: why profitable companies go bankrupt',
    sourceFile: `${BASE}/Semester 1/Financial Accounting/Session 22 & 23 MGMT 501 Handout.pdf`,
    searchHint: 'cash flow management startup SMB bankruptcy 2025',
    shinyboxAngle: 'ShinyBox services model: high revenue, lumpy cash flow. SaaS model: lower revenue upfront, predictable cash. Daniel needs to see this bridge.',
  },

  // ===== SEMESTER 1: ORGANIZATIONAL BEHAVIOR =====
  {
    course: 'Organizational Behavior (MGMT 510)',
    concept: 'How to build your network',
    sourceFile: `${BASE}/Semester 1/Organizational behivure/How_to_Build_Your_Network.pdf`,
    searchHint: 'professional network building BD enterprise sales 2025',
    shinyboxAngle: "Daniel's personal network is ShinyBox's only lead gen engine right now. Your first BD job: systematize it",
  },
  {
    course: 'Organizational Behavior (MGMT 510)',
    concept: 'Harnessing the science of persuasion',
    sourceFile: `${BASE}/Semester 1/Organizational behivure/Harnessing_the_Science_of_Persuasion.pdf`,
    searchHint: 'persuasion influence B2B enterprise sales psychology 2025',
    shinyboxAngle: "O&G HSE managers are loss-averse, not gain-seeking. Pitch incident prevention, not training quality. Loss framing wins.",
  },
  {
    course: 'Organizational Behavior (MGMT 510)',
    concept: 'Decision making: intuition vs deliberation',
    sourceFile: `${BASE}/Semester 1/Organizational behivure/Intuition_vs__Deliberation__How_Decision_Making_Can_Be_Improved (1).pdf`,
    searchHint: 'decision making bias cognitive enterprise leadership 2025',
    shinyboxAngle: "HSE managers make fast intuitive decisions in a crisis. VR training works because it builds the right intuitions before the crisis hits - that's the product insight",
  },
  {
    course: 'Organizational Behavior (MGMT 510)',
    concept: 'Amazon culture: high performance and employee experience',
    sourceFile: `${BASE}/Semester 1/Organizational behivure/Amazon_as_an_Employer (2).pdf`,
    searchHint: 'company culture performance management 2025 enterprise',
    shinyboxAngle: "You're building a BD function from scratch at ShinyBox - the culture you set in year 1 is the culture that scales",
  },

  // ===== SEMESTER 1: NEGOTIATION =====
  {
    course: 'Negotiation (MGMT 560)',
    concept: 'BATNA and negotiation leverage',
    sourceFile: `${BASE}/Semester 1/Negotiation/Reading`,
    searchHint: 'negotiation leverage enterprise deals B2B 2025',
    shinyboxAngle: "What's ShinyBox's BATNA in a big O&G deal? Understanding it determines how hard you can push on price and contract terms",
  },
  {
    course: 'Negotiation (MGMT 560)',
    concept: 'Creating value in negotiations (integrative vs distributive)',
    sourceFile: `${BASE}/Semester 1/Negotiation/Reading`,
    searchHint: 'win-win negotiation enterprise contract value creation 2025',
    shinyboxAngle: 'ShinyBox enterprise deals: pilot structures, outcome-based pricing, and performance guarantees are integrative moves that expand the pie',
  },

  // ===== SEMESTER 1: ECONOMICS =====
  {
    course: 'Economics (MGMT 530)',
    concept: 'Price elasticity and demand curves',
    sourceFile: `${BASE}/Semester 1/Ecconomics /Classes`,
    searchHint: 'pricing elasticity enterprise software demand 2025',
    shinyboxAngle: "O&G training budgets are largely inelastic to price when an incident is on the line. That's the structural pricing advantage ShinyBox isn't using yet",
  },
  {
    course: 'Economics (MGMT 530)',
    concept: 'Market failure and information asymmetry',
    sourceFile: `${BASE}/Semester 1/Ecconomics /Classes`,
    searchHint: 'information asymmetry market 2025 enterprise',
    shinyboxAngle: 'ShinyBox knows VR reduces incidents. The O&G buyer often does not have the data to verify that claim. Your BD job: close the information gap.',
  },

  // ===== SEMESTER 2: INFLUENCE =====
  {
    course: 'Influence (MGMT 785)',
    concept: "Cialdini's 6 principles of influence",
    sourceFile: `${BASE}/Semester 2/Influence/Influence Participant Guide - Fillable.pdf`,
    searchHint: 'influence persuasion enterprise sales psychology 2025',
    shinyboxAngle: 'Social proof (other O&G majors using it), scarcity (limited pilot spots), and authority (safety certifications) - three Cialdini levers for ShinyBox',
  },
  {
    course: 'Influence (MGMT 785)',
    concept: 'Reciprocity and relationship-based selling',
    sourceFile: `${BASE}/Semester 2/Influence/Influence Participant Guide - Fillable.pdf`,
    searchHint: 'enterprise sales relationship reciprocity referral 2025',
    shinyboxAngle: 'The highest-ROI BD move at ShinyBox: turn a successful pilot client into a reference. One warm intro is worth 50 cold calls.',
  },

  // ===== SEMESTER 2: GAME THEORY =====
  {
    course: 'Game Theory (MGMT 788)',
    concept: 'Nash equilibrium and strategic interdependence',
    sourceFile: `${BASE}/Semester 2/Game Teaory/Classes/05 - MGMT 788 - Hybrid PPT - Bruce Carlin.pptx`,
    searchHint: 'game theory competitive strategy market dynamics 2025',
    shinyboxAngle: "If ShinyBox and a competitor both race to sign the same 5 O&G majors, what's the equilibrium? First-mover advantage or commodity pricing war?",
  },
  {
    course: 'Game Theory (MGMT 788)',
    concept: 'Prisoner dilemma and cooperation in markets',
    sourceFile: `${BASE}/Semester 2/Game Teaory/Classes/06 - MGMT 788 - Hybrid PPT - Bruce Carlin.pptx`,
    searchHint: 'industry cooperation standards enterprise B2B 2025',
    shinyboxAngle: "Could ShinyBox partner with a complementary safety software vendor instead of competing? Cooperation often beats pure competition in B2B markets.",
  },

  // ===== SEMESTER 2: STRATEGY FORMULATION =====
  {
    course: 'Strategy Formulation (MGMT 571)',
    concept: 'VUCA world: strategy in volatile environments',
    sourceFile: `${BASE}/Semester 2/Strategy/Podcasts/Strategic_Choices_in_a_VUCA_World.m4a`,
    searchHint: 'strategic uncertainty oil gas energy sector 2025',
    shinyboxAngle: "O&G capex cycles are volatile. ShinyBox's recurring SaaS revenue is the hedge - clients keep paying even when they freeze project spend",
  },
  {
    course: 'Strategy Formulation (MGMT 571)',
    concept: "Jobs to be Done (Why you hire milkshakes)",
    sourceFile: `${BASE}/Semester 2/Strategy/Podcasts/Why_You_Hire_Milkshakes_and_Under_Armour.m4a`,
    searchHint: 'jobs to be done product market fit B2B 2025',
    shinyboxAngle: "HSE managers don't hire ShinyBox for 'VR training.' They hire it to survive a regulatory audit and keep their incident rate below the industry threshold.",
  },
  {
    course: 'Strategy Formulation (MGMT 571)',
    concept: 'LEGO: complexity almost destroyed a great company',
    sourceFile: `${BASE}/Semester 2/Strategy/Podcasts/How_Complexity_Almost_Destroyed_LEGO.m4a`,
    searchHint: 'product complexity focus core business 2025 company',
    shinyboxAngle: "ShinyBox is one 'yes' away from a custom side project that kills the SaaS roadmap. LEGO almost died doing this. Your job is to protect the core.",
  },
  {
    course: 'Strategy Formulation (MGMT 571)',
    concept: 'Global expansion vs local focus',
    sourceFile: `${BASE}/Semester 2/Strategy/Podcasts/Why_Distance_Still_Dictates_Global_Expansion.m4a`,
    searchHint: 'international expansion B2B SaaS 2025 GTM',
    shinyboxAngle: 'Middle East and Australia O&G markets are natural for ShinyBox. But geographic expansion before the US model works is how startups die.',
  },

  // ===== SEMESTER 2: DESIGN THINKING =====
  {
    course: 'Design Thinking (MGMT 650)',
    concept: 'Problem framing: asking the right question',
    sourceFile: `${BASE}/Semester 2/Design thinking /Session 1.pdf`,
    searchHint: 'design thinking problem framing product 2025',
    shinyboxAngle: "ShinyBox's real problem isn't 'how do we sell VR' - it's 'how do HSE managers justify training budget to CFOs?' Reframe the problem, change the solution.",
  },
  {
    course: 'Design Thinking (MGMT 650)',
    concept: 'Prototyping and testing with real users',
    sourceFile: `${BASE}/Semester 2/Design thinking /Session 1.pdf`,
    searchHint: 'product prototyping user testing B2B enterprise 2025',
    shinyboxAngle: "Can ShinyBox run a 2-week VR pilot at one facility before full contract? The prototype/pilot structure is the fastest way to prove ROI and close the deal.",
  },

  // ===== SEMESTER 2: GEN AI =====
  {
    course: 'Gen AI for Business (MGMT 650)',
    concept: 'AI product design: build vs buy foundation models',
    sourceFile: `${BASE}/Semester 2/Gen AI/Module 1.pdf`,
    searchHint: 'AI enterprise SaaS product 2025 build vs buy',
    shinyboxAngle: 'ShinyBox can use AI to personalize VR training scenarios per facility type - zero extra dev cost using existing models. That is a moat.',
  },
  {
    course: 'Gen AI for Business (MGMT 650)',
    concept: 'AI reshaping B2B sales (your own course material)',
    sourceFile: `${BASE}/Semester 2/Gen AI/The Future of Sales- How AI is Reshaping B2B SaaS Business Development.docx`,
    searchHint: 'AI sales automation CRM enterprise 2025',
    shinyboxAngle: "You wrote this for your Gen AI course. Now apply it: how does AI change ShinyBox's BD process specifically?",
  },

  // ===== SEMESTER 2: OPERATIONS =====
  {
    course: 'Operations Management (MGMT 580)',
    concept: 'Bottleneck theory and throughput optimization',
    sourceFile: `${BASE}/Semester 2/Operation Managmant/Classes`,
    searchHint: 'bottleneck theory operations constraints business 2025',
    shinyboxAngle: "ShinyBox's bottleneck is Daniel's network. Every deal flows through him. The BD playbook you build is the fix for this single point of failure.",
  },
  {
    course: 'Operations Management (MGMT 580)',
    concept: 'Make vs buy and outsourcing strategy',
    sourceFile: `${BASE}/Semester 2/Operation Managmant/Classes`,
    searchHint: 'make vs buy outsourcing enterprise 2025',
    shinyboxAngle: 'Should ShinyBox build VR content in-house or partner with content studios? The answer changes completely once you go SaaS vs services.',
  },

  // ===== SEMESTER 2: MANAGERIAL ACCOUNTING =====
  {
    course: 'Managerial Accounting (MGMT 500)',
    concept: 'Unit economics and contribution margin',
    sourceFile: `${BASE}/Semester 2/Managrial Accounting`,
    searchHint: 'unit economics SaaS contribution margin B2B 2025',
    shinyboxAngle: "What does one ShinyBox deal actually cost to deliver? If you don't know the contribution margin per client, you can't know which deals to prioritize.",
  },
  {
    course: 'Managerial Accounting (MGMT 500)',
    concept: 'Break-even analysis and pricing decisions',
    sourceFile: `${BASE}/Semester 2/Managrial Accounting`,
    searchHint: 'break even analysis pricing startup 2025',
    shinyboxAngle: 'At what ARR does ShinyBox break even on the SaaS model? This is the number you need before pitching the pivot to Daniel.',
  },

  // ===== SEMESTER 2: NEW ENTERPRISE (ShinyBox/Welding Startup) =====
  {
    course: 'New Enterprise (MGMT 665)',
    concept: 'Beachhead market: why you must go narrow first',
    sourceFile: `${BASE}/Semester 2/New Enterprise /Welding Startup`,
    searchHint: 'beachhead market startup narrow focus 2025',
    shinyboxAngle: "FieldFlow nailed beachhead thinking: Gulf Coast mechanical contractors, not all of O&G. ShinyBox's equivalent: which one O&G segment do you own first?",
  },
  {
    course: 'New Enterprise (MGMT 665)',
    concept: 'Customer discovery: what interviews reveal vs what surveys hide',
    sourceFile: `${BASE}/Semester 2/New Enterprise /Welding Startup`,
    searchHint: 'customer discovery interview startup product validation 2025',
    shinyboxAngle: "Your 19 FieldFlow interviews taught you: the buyer who feels the pain and the buyer who controls the budget are different people. Same is true at ShinyBox.",
  },
  {
    course: 'New Enterprise (MGMT 665)',
    concept: 'Services to SaaS: the transition playbook',
    sourceFile: `${BASE}/Semester 2/New Enterprise /ShinyBox_Mentor_Briefing_Omer_Biton.pdf`,
    searchHint: 'services to SaaS transition company 2025 productization',
    shinyboxAngle: "This is ShinyBox's core challenge. Every company that made this transition successfully did one thing: they stopped saying yes to custom work.",
  },

  // ===== SEMESTER 3: CLV =====
  {
    course: 'Customer Lifetime Value (MGMT 680)',
    concept: 'LTV:CAC ratio and what it means for growth',
    sourceFile: `${BASE}/Semester 3`,
    searchHint: 'LTV CAC SaaS unit economics 2025 growth',
    shinyboxAngle: "What's ShinyBox's CAC today? Entirely Daniel's personal time. What's the LTV? Unknown because there's no retention data. Fix the denominator before you optimize the numerator.",
  },
  {
    course: 'Customer Lifetime Value (MGMT 680)',
    concept: 'Churn math: why 20% annual churn kills a SaaS company',
    sourceFile: `${BASE}/Semester 3`,
    searchHint: 'churn rate SaaS retention 2025 enterprise',
    shinyboxAngle: "Enterprise VR training: is it annual renewal or one-time? If O&G clients retrain every 2-3 years, ShinyBox's ARR model has a structural churn problem.",
  },

  // ===== SEMESTER 3: STRATEGY IN TECH (MGMT 833) =====
  {
    course: 'Strategy in Technology Ecosystems (MGMT 833)',
    concept: 'Platform dynamics and network effects',
    sourceFile: `${BASE}/Semester 3`,
    searchHint: 'platform network effects SaaS ecosystem 2025',
    shinyboxAngle: 'Can ShinyBox become a marketplace? VR content creators + O&G operators + safety certification bodies = a platform moat competitors cannot replicate.',
  },
  {
    course: 'Strategy in Technology Ecosystems (MGMT 833)',
    concept: 'Winner-take-all vs winner-take-most markets',
    sourceFile: `${BASE}/Semester 3`,
    searchHint: 'market concentration winner take all tech 2025',
    shinyboxAngle: 'Industrial VR training is probably winner-take-most - 2-3 players survive. The question is whether ShinyBox has the BD velocity to be one of them.',
  },

  // ===== SEMESTER 3: PRICING (MGMT 682) =====
  {
    course: 'Pricing Strategies (MGMT 682)',
    concept: 'Value-based pricing vs cost-plus: the $40K difference',
    sourceFile: `${BASE}/Semester 3`,
    searchHint: 'value based pricing enterprise B2B SaaS 2025',
    shinyboxAngle: "ShinyBox is almost certainly pricing on cost + margin. The moment you tie price to incident prevention ROI, your average deal value doubles.",
  },
  {
    course: 'Pricing Strategies (MGMT 682)',
    concept: 'Freemium and trial conversion in enterprise',
    sourceFile: `${BASE}/Semester 3`,
    searchHint: 'enterprise freemium pilot conversion SaaS 2025',
    shinyboxAngle: 'A free 2-week VR pilot is not giving away value - it is the fastest path to a signed 12-month contract. Structure it so they cannot say no to the upgrade.',
  },

  // ===== SEMESTER 3: ENTERPRISE ACQUISITION (MGMT 627) =====
  {
    course: 'Enterprise Acquisition (MGMT 627)',
    concept: 'M&A synergies: why most deals destroy value',
    sourceFile: `${BASE}/Semester 3`,
    searchHint: 'M&A acquisition synergy failure 2025',
    shinyboxAngle: 'One exit path for ShinyBox: acquisition by a safety compliance SaaS (Intelex, SafetyCulture). The VR library + their distribution = synergy that actually makes sense.',
  },
  {
    course: 'Enterprise Acquisition (MGMT 627)',
    concept: 'Deal structure: equity, earnouts, and reps & warranties',
    sourceFile: `${BASE}/Semester 3`,
    searchHint: 'startup acquisition deal structure 2025',
    shinyboxAngle: "You just negotiated your own employment contract. The same principles apply when ShinyBox eventually sells - earnout structures favor buyers, not founders.",
  },

  // ===== SEMESTER 3: AI FOR CUSTOMER ANALYTICS (MGMT 769) =====
  {
    course: 'AI for Customer Analytics (MGMT 769)',
    concept: 'Churn prediction models: which customers are about to leave',
    sourceFile: `${BASE}/Semester 3`,
    searchHint: 'churn prediction machine learning enterprise 2025',
    shinyboxAngle: "Once ShinyBox has 20+ clients, a simple usage-based churn model tells you which accounts to call before renewal. This is the first analytics feature to build.",
  },
  {
    course: 'AI for Customer Analytics (MGMT 769)',
    concept: 'Customer segmentation: who are your best customers?',
    sourceFile: `${BASE}/Semester 3`,
    searchHint: 'customer segmentation enterprise B2B analytics 2025',
    shinyboxAngle: "Not all O&G clients are equal. A simple RFM segmentation (Recency, Frequency, Money) tells you where to spend your BD energy and where to fire clients.",
  },

  // ===== SEMESTER 3: POWER & INFLUENCE (MGMT 784) =====
  {
    course: 'Power and Influence in Organizations (MGMT 784)',
    concept: 'Coalition building and internal politics',
    sourceFile: `${BASE}/Semester 3`,
    searchHint: 'organizational politics enterprise champion 2025',
    shinyboxAngle: "Every ShinyBox enterprise deal needs a champion inside the client. Your BD job: find the HSE manager who wants this to work, and make them a hero.",
  },
  {
    course: 'Power and Influence in Organizations (MGMT 784)',
    concept: 'Managing up: how to influence people with authority over you',
    sourceFile: `${BASE}/Semester 3`,
    searchHint: 'managing up executive influence 2025',
    shinyboxAngle: "You're the first BD hire. Daniel is the CEO and your primary lead source. How you manage that relationship determines your Year 1 results.",
  },

  // ===== SEMESTER 3: GENAI STRATEGY (MGMT 720) =====
  {
    course: 'genAI: Strategy and Integration (MGMT 720)',
    concept: 'AI moats: what actually makes an AI company defensible',
    sourceFile: `${BASE}/Semester 3`,
    searchHint: 'AI moat defensibility enterprise startup 2025',
    shinyboxAngle: "ShinyBox's AI moat: proprietary incident data from client deployments. If they track outcomes, nobody else has that training dataset. That's the real asset.",
  },
  {
    course: 'genAI: Strategy and Integration (MGMT 720)',
    concept: 'Prompt engineering as a business capability',
    sourceFile: `${BASE}/Semester 3`,
    searchHint: 'AI prompt engineering enterprise productivity 2025',
    shinyboxAngle: 'Every ShinyBox sales email, proposal, and follow-up can be 3x faster with a good AI workflow. You have the skills - build the BD playbook around them.',
  },

  // ===== SEMESTER 3: STRATEGIC INNOVATION (MGMT 715) =====
  {
    course: 'Strategic Innovation (MGMT 715)',
    concept: 'Disruptive innovation: why incumbents always lose',
    sourceFile: `${BASE}/Semester 3`,
    searchHint: 'disruptive innovation Christensen enterprise 2025',
    shinyboxAngle: "Traditional HSE training vendors (paper, video, LMS) are the incumbents. ShinyBox is the disruptor. Christensen says: start at the low end or a niche the incumbent ignores.",
  },
  {
    course: 'Strategic Innovation (MGMT 715)',
    concept: 'Crossing the chasm: from early adopters to early majority',
    sourceFile: `${BASE}/Semester 3`,
    searchHint: 'crossing the chasm enterprise technology adoption 2025',
    shinyboxAngle: "ShinyBox is still in the chasm. The early adopters (safety-forward O&G companies) said yes. The early majority (everyone else) needs a proven ROI, not a pitch.",
  },

];

module.exports = topics;
