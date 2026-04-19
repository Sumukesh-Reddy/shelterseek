
const http = require('http');

const API_URL = 'http://localhost:5000/api/rooms';

const fetchEndpoint = () => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    http.get(API_URL, (res) => {
      let data = '';
      const isHit = res.headers['x-cache'] === 'HIT';
      
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          time: Date.now() - start,
          isHit,
          status: res.statusCode
        });
      });
    }).on('error', reject);
  });
};

async function runBenchmark() {
  console.log('🚀 Starting Performance Benchmark (Redis Caching)\n');
  
  try {
    // 1. Initial Request (Cache MISS)
    console.log('📉 First Request: Fetching from MongoDB (Cache MISS)...');
    const first = await fetchEndpoint();
    console.log(`⏱️  Time: ${first.time}ms\n`);

    // 2. Second Request (Cache HIT)
    console.log('📈 Second Request: Fetching from Redis (Cache HIT)...');
    const second = await fetchEndpoint();
    console.log(`⏱️  Time: ${second.time}ms\n`);

    // Comparison
    const improvement = ((first.time - second.time) / first.time * 100).toFixed(2);
    console.log('📊 Result Analysis:');
    console.log(`✅ Cache MISS: ${first.time}ms`);
    console.log(`🔥 Cache HIT:  ${second.time}ms`);
    console.log(`🚀 Improvement: ${improvement}% faster!`);
    
    if (second.time < first.time) {
      console.log('\n✨ This demonstrates that Redis significantly reduces database load and response times.');
    } else {
      console.log('\n⚠️ Small datasets might show negligible difference in a local environment, but high-load production environments see massive benefits.');
    }

  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.log('❌ Error: Server is not running on http://localhost:5000. Start the server first!');
    } else {
      console.log('❌ Error:', err.message);
    }
  }
}

runBenchmark();
