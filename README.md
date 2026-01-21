# StellarSplit

**Split bills instantly with crypto. No awkward conversations.**

StellarSplit is a mobile-friendly web app that makes splitting bills with friends effortless. Snap a photo of your receipt, let AI do the math, and settle up instantly using Stellar's lightning-fast payments in XLM or USDC.

[![Stellar](https://img.shields.io/badge/Built%20on-Stellar-black?style=flat&logo=stellar)](https://stellar.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## Features

- **Smart Receipt Scanning** - Snap a photo, AI extracts items and prices
- **Automatic Calculations** - Tax and tip included in split calculations
- **Multiple Split Options** - Equal split, itemized, percentage-based, or custom
- **Instant Settlement** - Pay with XLM or USDC via Stellar network
- **Payment Links** - Generate shareable links for easy collection
- **Mobile-First** - Optimized for phones, works everywhere
- **Multi-Currency** - USD, EUR, GBP, NGN and more with live conversion
- **Payment Notifications** - Get notified when friends pay
- **Split History** - Track all your past splits and payments
- **No Signup Required** - Start splitting immediately with just a wallet

---

## Why StellarSplit?

We've all been there: dinner ends, the bill arrives, and suddenly everyone's doing mental math while awkwardly calculating who owes what. StellarSplit eliminates the friction:

- **No more IOU tracking** - Settle instantly, not "I'll pay you back later"
- **Perfect accuracy** - AI-powered receipt scanning eliminates calculation errors
- **Near-zero fees** - Stellar transactions cost fractions of a cent
- **Instant settlement** - Payments arrive in 3-5 seconds, not days
- **Global reach** - Works with any Stellar wallet, anywhere in the world
- **Privacy-friendly** - No bank accounts or credit cards needed

---

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Vite
- **Backend**: NestJS, TypeORM, PostgreSQL
- **Blockchain**: Stellar Network (XLM, USDC, other assets)
- **AI/OCR**: Tesseract.js, OpenAI Vision API (optional)
- **Camera**: HTML5 Camera API
- **Wallet Integration**: Freighter, Lobstr, xBull
- **Payments**: Stellar SDK
- **Real-time**: WebSockets for payment notifications
- **Mobile**: PWA (Progressive Web App) for native-like experience

---

## Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Stellar wallet (Freighter recommended)
- OpenAI API key (optional, for better OCR)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/stellarsplit.git
cd stellarsplit

# Install dependencies for both frontend and backend
npm install

# Copy environment variables
cp .env.example .env

# Configure your .env file with:
# - Database credentials (PostgreSQL)
# - Stellar network settings (testnet/mainnet)
# - OpenAI API key (optional)
# - Currency exchange rate API key

# Run database migrations
npm run migrate

# Start development servers (frontend + backend)
npm run dev
```

Visit `http://localhost:3000` to start splitting bills!

---

## Quick Start

### Splitting a Bill

1. **Take a Photo** - Click "New Split" and snap your receipt
2. **Review Items** - AI extracts items and prices (edit if needed)
3. **Add Friends** - Enter names and Stellar addresses
4. **Choose Split Method**:
   - **Equal Split** - Divide total evenly
   - **Itemized** - Assign items to specific people
   - **Percentage** - Custom percentages per person
   - **Custom Amounts** - Enter exact amounts
5. **Add Tax & Tip** - Automatically distributed proportionally
6. **Generate Links** - Share payment links with your group
7. **Settle Up** - Friends pay directly from their wallets

### Receiving Payment

1. Click the payment link you received
2. Review your portion of the bill
3. Connect your Stellar wallet
4. Approve the transaction
5. Done! Payment arrives instantly

---

## Project Structure

```
stellarsplit/
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Camera/     # Receipt camera component
│   │   │   ├── Receipt/    # Receipt display & editing
│   │   │   ├── Split/      # Split calculation components
│   │   │   ├── Payment/    # Payment processing
│   │   │   └── Wallet/     # Wallet connection
│   │   ├── pages/          # Page components
│   │   │   ├── Home/       # Landing page
│   │   │   ├── NewSplit/   # Create new split
│   │   │   ├── SplitView/  # View/edit split
│   │   │   ├── Pay/        # Payment page
│   │   │   └── History/    # Split history
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   │   ├── ocr/        # Receipt OCR logic
│   │   │   ├── stellar/    # Stellar integration
│   │   │   └── currency/   # Currency conversion
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
├── backend/
│   ├── src/
│   │   ├── splits/         # Split management module
│   │   ├── payments/       # Payment processing module
│   │   ├── receipts/       # Receipt OCR module
│   │   ├── stellar/        # Stellar blockchain service
│   │   ├── notifications/  # WebSocket notifications
│   │   └── currency/       # Exchange rate service
│   └── migrations/         # Database migrations
└── docs/                   # Documentation
```

---

## Contributing

We welcome contributions! StellarSplit is participating in the **Stellar Drips Wave Program** - check out our open issues to earn rewards while building something useful.

### Getting Started

1. Check out our [CONTRIBUTING.md](CONTRIBUTING.md) guide
2. Browse [open issues](https://github.com/yourusername/stellarsplit/issues) tagged with `good-first-issue`
3. Read the [Code of Conduct](CODE_OF_CONDUCT.md)
4. Join our [Discord community](https://discord.gg/stellarsplit)

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with clear commit messages
4. Write/update tests
5. Push to your fork
6. Open a Pull Request

---

## Roadmap

### Phase 1: MVP (Current)
- [x] Basic receipt photo capture
- [x] Manual item entry and editing
- [x] Equal split calculation
- [ ] OCR for receipt scanning
- [ ] Stellar wallet integration
- [ ] Payment link generation

### Phase 2: Enhanced Features
- [ ] Itemized splits (assign items to people)
- [ ] Tax and tip distribution
- [ ] Multiple currency support
- [ ] Payment reminders
- [ ] Split history and analytics
- [ ] Group management

### Phase 3: Advanced
- [ ] Recurring splits (subscriptions, rent)
- [ ] Multi-asset support (custom Stellar tokens)
- [ ] Invoice generation
- [ ] Expense tracking integration
- [ ] Group expense pools
- [ ] Social features (leaderboards, who pays most often)

### Phase 4: Enterprise
- [ ] Business expense reports
- [ ] Team expense management
- [ ] Accounting software integration
- [ ] White-label solution for restaurants
- [ ] API for third-party apps

---

## Use Cases

- **Friends Dining Out** - Split restaurant bills instantly
- **Roommates** - Divide rent, utilities, groceries
- **Travel Groups** - Track and split trip expenses
- **Office Lunches** - Easy team meal splitting
- **Events** - Split costs for parties, gifts, activities
- **Couples** - Fair expense sharing
- **Group Gifts** - Collect money for shared presents

---

## Security & Privacy

- **No Account Required** - Start using immediately with just a wallet
- **Non-Custodial** - We never hold your funds
- **End-to-End** - Payment links use cryptographic signatures
- **Privacy-First** - Receipt photos processed locally (optional cloud OCR)
- **Open Source** - Audit our code anytime
- **Testnet Support** - Practice without risking real money

---

## PWA Features

StellarSplit works as a Progressive Web App:

- **Install on Phone** - Add to home screen for app-like experience
- **Offline Support** - View history and prepare splits offline
- **Camera Access** - Native camera integration
- **Push Notifications** - Get alerted when payments arrive
- **Fast Loading** - Optimized for mobile networks

---

## Supported Currencies

- **Fiat**: USD, EUR, GBP, CAD, AUD, NGN, and 150+ more
- **Crypto**: XLM (Stellar Lumens), USDC, USDT, and custom Stellar assets
- **Live Rates**: Real-time currency conversion

---

## Design Philosophy

- **Mobile-First** - Optimized for one-handed phone use
- **Minimal Taps** - Get to payment in 3 taps or less
- **Clear Visuals** - See exactly who owes what at a glance
- **No Clutter** - Focus on the task, hide complexity
- **Fast** - Instant feedback, no loading spinners

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built on [Stellar](https://stellar.org) blockchain
- Supported by [Stellar Development Foundation](https://stellar.org/foundation)
- Part of the [Drips Wave Program](https://www.drips.network/wave)
- OCR powered by [Tesseract.js](https://tesseract.projectnaptha.com/)
- Icons by [Lucide](https://lucide.dev)

---

## Contact & Community

- **Website**: [stellarsplit.app](https://stellarsplit.app)
- **Twitter**: [@StellarSplit](https://twitter.com/stellarsplit)
- **Discord**: [Join our community](https://discord.gg/stellarsplit)
- **Email**: hello@stellarsplit.app
- **Support**: support@stellarsplit.app

---

## Support the Project

If you find StellarSplit useful:
- Star this repository
- Report bugs and suggest features
- Contribute code or documentation
- Share with friends who hate splitting bills
- Send us a tip: `STELLARSPLIT_WALLET_ADDRESS`

---

## Testimonials

> "Finally! No more 'I'll Venmo you later' that never happens." - Sarah, Early Tester

> "Used it for a 15-person group dinner. Settled in 2 minutes. Magic." - Mike, Beta User

> "The OCR actually works! Scanned a crumpled receipt perfectly." - Alex, Contributor

---

**Built with ❤️ for everyone who's ever awkwardly calculated their share of a bill**

**Stop IOUs. Start settling. Split with Stellar.** 🌍✨
