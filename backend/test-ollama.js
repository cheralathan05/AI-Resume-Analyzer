const axios = require('axios');

async function test() {
  try {
    console.log('Testing connection to Ollama at http://127.0.0.1:11434...');
    const tagsRes = await axios.get('http://127.0.0.1:11434/api/tags');
    console.log('Installed models:', (tagsRes.data?.models || []).map(m => m.name));

    console.log('Testing model inference with qwen3:8b...');
    const res = await axios.post('http://127.0.0.1:11434/api/generate', {
      model: 'qwen3:8b',
      prompt: 'Respond with valid JSON: {"status": "ready", "service": "ollama"}',
      stream: false,
      format: 'json',
      options: {
        temperature: 0.1,
        num_predict: 400
      }
    });
    console.log('Response:', res.data.response);
    console.log('Thinking:', res.data.thinking ? res.data.thinking.slice(0, 100) : 'none');
    console.log('Ollama is working properly!');
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

test();
