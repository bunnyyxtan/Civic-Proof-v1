// src/lib/audio/downsample.ts

export function downsampleBuffer(input: Float32Array, inputRate: number, targetRate = 16000): Float32Array {
  if (inputRate <= targetRate) {
    return input;
  }
  const sampleRateRatio = inputRate / targetRate;
  const newLength = Math.round(input.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  
  let offsetResult = 0;
  let offsetInput = 0;
  
  while (offsetResult < result.length) {
    const nextOffsetInput = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0, count = 0;
    for (let i = offsetInput; i < nextOffsetInput && i < input.length; i++) {
      accum += input[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetInput = nextOffsetInput;
  }
  
  return result;
}
