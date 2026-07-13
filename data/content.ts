export const NAV_LINKS = [
  { label: "Home", href: "#hero" },
  { label: "How It Works", href: "#how" },
  { label: "Properties", href: "#properties" },
  { label: "Plans", href: "#plans" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export interface TickerItem {
  label: string;
  val: string;
}

export const TICKER_DATA: TickerItem[] = [
  { label: "Lekki Phase 1", val: "+12.4% Yield" },
  { label: "Yaba Rental", val: "98% Occupancy" },
  { label: "Ikoyi Duplex", val: "+₦3.6B Value" },
  { label: "Ajah Flats", val: "+9.8% Yield" },
  { label: "VI Commercial", val: "100% Leased" },
  { label: "Gbagada Homes", val: "+11.2% Yield" },
  { label: "Ikeja Studios", val: "95% Occupancy" },
  { label: "Lagos Island", val: "+₦2.7B Value" },
  { label: "Maitama", val: "+10.5% Yield" },
  { label: "Asokoro", val: "97% Occupancy" },
  { label: "Wuse II", val: "+₦4.2B Value" },
  { label: "Garki", val: "+8.9% Yield" },
  { label: "Gwarinpa", val: "100% Leased" },
  { label: "Old GRA", val: "+13.1% Yield" },
  { label: "New GRA", val: "96% Occupancy" },
  { label: "Elekahia", val: "+₦1.8B Value" },
  { label: "Rumuola", val: "+11.5% Yield" },
];

export const HOW_STEPS = [
  {
    num: "01",
    icon: "fa-user-plus",
    title: "Create Account",
    desc: "Sign up in under 2 minutes. Complete your KYC and choose your investment capacity.",
  },
  {
    num: "02",
    icon: "fa-handshake",
    title: "Pool Funds",
    desc: "Your capital joins other investors in a dedicated property SPV. Full transparency on fund pooling.",
  },
  {
    num: "03",
    icon: "fa-building",
    title: "Acquire Property",
    desc: "Nulo Africa sources, verifies, and acquires high-yield rental properties on behalf of the pool.",
  },
  {
    num: "04",
    icon: "fa-coins",
    title: "Share Rentals",
    desc: "Rental income is collected by Nulo, expenses deducted, and net proceeds distributed to your wallet monthly.",
  },
];

export type PropertyStatus = "Funding" | "Live";

export interface PropertyItem {
  title: string;
  location: string;
  price: string;
  yield: string;
  units: number;
  occupied: number;
  status: PropertyStatus;
  img: string;
  tag: string;
}

export const PROPERTIES: PropertyItem[] = [
  {
    title: "Lekki Phase 1 — 4-Bed Terrace",
    location: "Lekki Phase 1, Lagos",
    price: "₦185M",
    yield: "14.2%",
    units: 6,
    occupied: 5,
    status: "Funding",
    img: "https://picsum.photos/seed/nestlekki1/600/400.jpg",
    tag: "Hot",
  },
  {
    title: "Ikoyi — 3-Bed Luxury Apartment",
    location: "Old Ikoyi, Lagos",
    price: "₦320M",
    yield: "11.8%",
    units: 4,
    occupied: 4,
    status: "Live",
    img: "https://picsum.photos/seed/nestikoyi2/600/400.jpg",
    tag: "Premium",
  },
  {
    title: "Yaba — 8-Unit Mini Flats",
    location: "Yaba, Lagos",
    price: "₦95M",
    yield: "16.5%",
    units: 8,
    occupied: 7,
    status: "Funding",
    img: "https://picsum.photos/seed/nestyaba3/600/400.jpg",
    tag: "High Yield",
  },
  {
    title: "Gbagada — 5-Bed Detached Duplex",
    location: "Gbagada, Lagos",
    price: "₦210M",
    yield: "12.9%",
    units: 1,
    occupied: 1,
    status: "Live",
    img: "https://picsum.photos/seed/nestgbag4/600/400.jpg",
    tag: "Stable",
  },
  {
    title: "Ajah — 12-Unit Block of Flats",
    location: "Ajah, Lagos",
    price: "₦145M",
    yield: "15.1%",
    units: 12,
    occupied: 10,
    status: "Funding",
    img: "https://picsum.photos/seed/nestajah5/600/400.jpg",
    tag: "New",
  },
  {
    title: "VI — Commercial Office Space",
    location: "Victoria Island, Lagos",
    price: "₦480M",
    yield: "10.5%",
    units: 8,
    occupied: 8,
    status: "Live",
    img: "https://picsum.photos/seed/nestvi6/600/400.jpg",
    tag: "Commercial",
  },
];

export const PLANS = [
  {
    name: "Co-Owner Starter",
    min: "₦500K",
    max: "₦4.9M",
    roi: "10-12%",
    duration: "12 Months",
    perks: [
      "Monthly rental payouts",
      "Property selection access",
      "Dashboard tracking",
      "Email reports",
    ],
    popular: false,
  },
  {
    name: "Co-Owner Growth",
    min: "₦5M",
    max: "₦24.9M",
    roi: "12-15%",
    duration: "18 Months",
    perks: [
      "All Starter perks",
      "Priority property allocation",
      "Quarterly site visits",
      "Dedicated relationship manager",
      "Capital appreciation upside",
    ],
    popular: true,
  },
  {
    name: "Co-Owner Premium",
    min: "₦25M",
    max: "₦99.9M",
    roi: "14-18%",
    duration: "24 Months",
    perks: [
      "All Growth perks",
      "Bi-weekly payouts",
      "VIP property previews",
      "Co-investment committee seat",
      "Tax optimization advisory",
    ],
    popular: false,
  },
  {
    name: "Co-Owner Elite",
    min: "₦100M",
    max: "Unlimited",
    roi: "16-22%",
    duration: "36 Months",
    perks: [
      "All Premium perks",
      "Weekly payouts",
      "Custom property sourcing",
      "Board advisory access",
      "Exit strategy planning",
      "Property management rights",
    ],
    popular: false,
  },
];

export const STATS = [
  { value: 3200, suffix: "+", label: "Co-Owners" },
  { value: 47, suffix: "", label: "Properties Acquired" },
  { value: 13.8, suffix: "%", label: "Average Rental Yield" },
  { value: 2.4, suffix: "B", prefix: "₦", label: "Total Rents Distributed" },
];

export const TESTIMONIALS = [
  {
    name: "Chidinma Eze",
    role: "Co-Owner since 2022",
    text: "I put in ₦5M into the Lekki terrace pool. Every month I get rental credits directly to my wallet. It's the most passive income I've ever earned — Nulo handles everything.",
    avatar: "https://picsum.photos/seed/nestt1/100/100.jpg",
  },
  {
    name: "Adebayo Ogunleye",
    role: "Co-Owner since 2021",
    text: "As someone living in London, I wanted to invest in Lagos real estate without the headache. NEST gave me that. I co-own 3 properties now and the returns are consistent.",
    avatar: "https://picsum.photos/seed/nestt2/100/100.jpg",
  },
  {
    name: "Fatima Musa",
    role: "Co-Owner since 2023",
    text: "I started with just ₦1M to test the waters. Six months later I increased to ₦10M. The transparency on the dashboard — seeing occupancy, maintenance, and my share — is incredible.",
    avatar: "https://picsum.photos/seed/nestt3/100/100.jpg",
  },
  {
    name: "Obinna Nwosu",
    role: "Co-Owner since 2022",
    text: "What sold me was that Nulo Africa already manages 500+ properties. They're not guessing — they have real data on what rents, where, and for how much. That's real expertise.",
    avatar: "https://picsum.photos/seed/nestt4/100/100.jpg",
  },
];

export const YIELD_DATA = [8.2, 9.5, 11.3, 10.8, 12.1, 13.5, 12.9, 14.2, 13.8, 15.1, 14.7, 16.2];
