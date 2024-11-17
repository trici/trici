class CustomSeedSource {
  constructor(seeds) {
    this.seeds = seeds;
  }

  getSeeds() {
    return Promise.resolve(Object.keys(this.seeds));
  }

  getSeed(seedName) {
    return Promise.resolve(this.seeds[seedName]);
  }

  getSeedName(seed) {
    return seed;
  }
}

module.exports = CustomSeedSource;
