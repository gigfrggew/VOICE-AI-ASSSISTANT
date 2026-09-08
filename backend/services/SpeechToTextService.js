async function speechToText(audioBuffer, contentType) {
  if (!audioBuffer) {
    throw new Error("Audio data is required");
  }

  const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      "Content-Type": contentType || "audio/wav",
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Deepgram Speech-to-Text failed: ${errorText}`);
  }

  const data = await response.json();

  const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

  return transcript || "";
}

export { speechToText };