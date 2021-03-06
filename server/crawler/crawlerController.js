const Crawler = require('./crawlerModel.js');
const Interval = require('./intervalModel.js');
const NodeCrawler = require('./crawler.js');

// Object containing intervals, so they can be paused or terminated
// Key is the name of the endpoint/scrape
// Value is the timer object returned when the interval is set
const intervals = {};

const crawlerController = {
  getCache: async (req, res, next) => {
    try {
      const endpoint = req.params.endpoint;
      // Send document back as JSON object
      res.json(await Crawler.find({ endpoint }));
    } catch (err) {
      console.log (err);
    }
    next();
  },
  
  // Sets up a scrape to run on an interval
  // Currently scrapes trulia only
  startScrapeInterval: async (req, res) => {
    // For test purposes:
    const url = req.body.url;
    const endpoint = req.body.endpoint;
    const interval = req.body.interval * 1000;
    
    // If the endpoint already has an interval
      // Stop the interval
    if (intervals[endpoint]) clearInterval(intervals[endpoint]);
    
    // Create a new interval
    intervals[endpoint] = setInterval(
      () => NodeCrawler(url, endpoint),
      interval
    );
    
    // Save the interval to the DB
    // Upsert (insert if doesn't exist, else update)
    try { await Interval.update({ endpoint }, { endpoint, url, interval }, { upsert : true }); }
    catch (err) { console.log(err); }
  },
  
  // Creates intervals for each endpoint in Intervals collection
  // May be used when server restarts and intervals should start again
  restartIntervals: async function () {    
    // Get all endpoints
    const endpointsToRestart = await Interval.find({});
    
    // Restart endpoints
    endpointsToRestart.forEach(endpoint => this.startScrapeInterval(endpoint.endpoint, endpoint.interval));
  }
}



module.exports = crawlerController;