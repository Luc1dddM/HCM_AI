/**
 * Demo script for testing OCR and Hybrid search APIs
 */

// Example API calls for testing the new endpoints

// 1. OCR-only Search
const testOCRSearch = async () => {
  const payload = {
    ocr_query: "Hôm nay",
    top_k: 10,
    case_sensitive: false
  };

  try {
    const response = await fetch('http://localhost:8000/keyframe/search/metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('OCR Search Results:', data);
    return data;
  } catch (error) {
    console.error('OCR Search Error:', error);
  }
};

// 2. Hybrid Search
const testHybridSearch = async () => {
  const payload = {
    query: "người đi bộ trong công viên",
    ocr_query: "Hôm nay",
    top_k: 10,
    score_threshold: 0.5,
    embedding_weight: 0.7,
    metadata_weight: 0.3,
    case_sensitive: false
  };

  try {
    const response = await fetch('http://localhost:8000/keyframe/search/hybrid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Hybrid Search Results:', data);
    return data;
  } catch (error) {
    console.error('Hybrid Search Error:', error);
  }
};

// 3. Test different OCR queries
const testMultipleOCRQueries = async () => {
  const queries = [
    "Việt Nam",
    "Hôm nay",
    "tin tức",
    "thời tiết",
    "xe hơi"
  ];

  console.log('=== Testing Multiple OCR Queries ===');
  
  for (const query of queries) {
    console.log(`\nTesting OCR query: "${query}"`);
    
    const payload = {
      ocr_query: query,
      top_k: 5,
      case_sensitive: false
    };

    try {
      const response = await fetch('http://localhost:8000/keyframe/search/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`  Found ${data.results?.length || 0} results`);
      } else {
        console.log(`  Error: ${response.status}`);
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

// 4. Test hybrid with different weight combinations
const testHybridWeights = async () => {
  const weightCombinations = [
    { embedding: 1.0, metadata: 0.0 }, // Pure embedding
    { embedding: 0.8, metadata: 0.2 }, // Embedding dominant
    { embedding: 0.7, metadata: 0.3 }, // Default
    { embedding: 0.5, metadata: 0.5 }, // Balanced
    { embedding: 0.2, metadata: 0.8 }, // Metadata dominant
    { embedding: 0.0, metadata: 1.0 }, // Pure metadata
  ];

  console.log('=== Testing Different Weight Combinations ===');
  
  for (const weights of weightCombinations) {
    console.log(`\nTesting weights: Embedding ${weights.embedding}, Metadata ${weights.metadata}`);
    
    const payload = {
      query: "người đi bộ",
      ocr_query: "Hôm nay",
      top_k: 5,
      score_threshold: 0.3,
      embedding_weight: weights.embedding,
      metadata_weight: weights.metadata,
      case_sensitive: false
    };

    try {
      const response = await fetch('http://localhost:8000/keyframe/search/hybrid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`  Found ${data.results?.length || 0} results`);
        if (data.results?.length > 0) {
          console.log(`  Best score: ${data.results[0].score?.toFixed(3)}`);
        }
      } else {
        console.log(`  Error: ${response.status}`);
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

// 5. Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting OCR and Hybrid Search Tests');
  console.log('=====================================');
  
  console.log('\n1. Testing OCR-only Search...');
  await testOCRSearch();
  
  console.log('\n2. Testing Hybrid Search...');
  await testHybridSearch();
  
  console.log('\n3. Testing Multiple OCR Queries...');
  await testMultipleOCRQueries();
  
  console.log('\n4. Testing Different Weight Combinations...');
  await testHybridWeights();
  
  console.log('\n✅ All tests completed!');
};

// Export functions for browser console usage
window.ocrSearchTests = {
  testOCRSearch,
  testHybridSearch,
  testMultipleOCRQueries,
  testHybridWeights,
  runAllTests
};

console.log('OCR Search test functions loaded!');
console.log('Available functions:');
console.log('- ocrSearchTests.testOCRSearch()');
console.log('- ocrSearchTests.testHybridSearch()');
console.log('- ocrSearchTests.testMultipleOCRQueries()');
console.log('- ocrSearchTests.testHybridWeights()');
console.log('- ocrSearchTests.runAllTests()');
