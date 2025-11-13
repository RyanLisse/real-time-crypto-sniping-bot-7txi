# Crypto Sniper Bot

Real-time, latency-optimized crypto trading bot for MEXC new listings with live dashboard.

## Architecture

### Backend Services

- **market-monitor**: WebSocket integration with MEXC for real-time market data and new listing detection
- **trade-executor**: Sub-100ms trade execution engine with MEXC API integration
- **risk-manager**: Risk analysis, position sizing, and trading configuration
- **api**: Dashboard API with streaming WebSocket updates

### Tech Stack

- **Backend**: Encore.ts, Effect-TS, Bun
- **Frontend**: Next.js 16, React, Tailwind CSS v4, shadcn/ui
- **Database**: NeonDB (PostgreSQL)
- **Real-time**: WebSocket streams for live updates

## Features

### Market Monitoring
- Real-time WebSocket connection to MEXC
- Automatic new listing detection
- Market data streaming (price, volume, bid/ask)
- Historical listing tracking

### Trading Execution
- Sub-100ms execution latency target
- Market and limit order support
- Automatic new listing trading
- Trade history and analytics

### Risk Management
- Configurable position sizing
- Stop loss and take profit settings
- Maximum trade amount limits
- Real-time risk metrics

### Dashboard
- Live event feed with WebSocket updates
- Listings panel with detection history
- Trade history with latency metrics
- Risk metrics visualization
- Configuration management UI

## Setup

### Required Secrets

Configure these in Settings:

1. **MEXCApiKey**: Your MEXC API key
2. **MEXCSecretKey**: Your MEXC API secret

### Database

The bot uses NeonDB with automatic migrations:

- `001_imported_schema.up.sql`: Imported base schema
- `002_crypto_bot_schema.up.sql`: Bot-specific tables (listings, trades, market_data, bot_health, trade_config)

### Starting the Bot

1. Configure your MEXC API credentials in Settings
2. Adjust trading parameters in the Configuration tab
3. Click "Start Monitoring" to begin tracking MEXC listings
4. Enable trading in Configuration to auto-trade new listings

## API Endpoints

### Market Monitor
- `POST /monitor/start` - Start market monitoring
- `POST /monitor/stop` - Stop market monitoring
- `GET /monitor/status` - Get monitoring status

### Trade Executor
- `POST /trade/execute` - Execute a trade
- `GET /trade/history` - Get trade history

### Risk Manager
- `GET /risk/metrics` - Get risk metrics
- `POST /risk/validate` - Validate trade request
- `GET /config` - Get trading configuration
- `PUT /config` - Update trading configuration

### API
- `GET /listings` - List detected listings
- `GET /health` - System health check
- `GET /analytics/performance` - Performance metrics
- `streamOut /dashboard/stream` - Live dashboard event stream

## Performance Optimization

- WebSocket reconnection with exponential backoff
- In-memory caching of known symbols
- Optimized database queries with indexes
- Latency tracking on all operations
- Warning logs for operations > 100ms

## Safety Features

- Trading can be disabled via config
- Position size limits
- Trade amount limits
- Trade validation before execution
- Error tracking and logging
- Failed trade recording

## Monitoring

The dashboard provides real-time monitoring of:

- Active monitoring status
- Total exposure and active positions
- Win rate and trade statistics
- Average execution latency
- Live event stream
- Recent listings and trades

## Development

Built with Encore.ts for:
- Type-safe API definitions
- Built-in database migrations
- Pub/Sub messaging
- Secrets management
- Real-time streaming APIs
