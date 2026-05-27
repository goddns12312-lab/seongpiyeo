const PcbangkingdomAdapter = require('./pcbangkingdom-adapter');

const ADAPTERS = {
  [PcbangkingdomAdapter.sourceName]: PcbangkingdomAdapter
  // 향후: 'pcbangnet': PcbangnetAdapter
};

function getAdapter(name) {
  const AdapterClass = ADAPTERS[name];
  if (!AdapterClass) {
    const available = Object.keys(ADAPTERS).join(', ');
    throw new Error(`Unknown adapter: "${name}". Available: ${available}`);
  }
  return AdapterClass;
}

function listAdapters() {
  return Object.entries(ADAPTERS).map(([name, AdapterClass]) => ({
    name,
    displayName: AdapterClass.displayName
  }));
}

module.exports = {
  ADAPTERS,
  getAdapter,
  listAdapters
};
