export function prettify(sentence, maxLength) {
  if (typeof sentence !== "string" || typeof maxLength !== "number") {
    throw new TypeError(
      "Invalid input: 'sentence' must be a string and 'maxLength' a number."
    );
  }
  let result = "";
  let currentLine = "";

  sentence.split(" ").forEach((word) => {
    if ((currentLine + word).length > maxLength) {
      result += currentLine.trim() + "\n";
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  });

  result += currentLine.trim(); // Add the last line
  return result;
}

export function utf8ToBase64(str) {
  return btoa(
    new Uint8Array(new TextEncoder().encode(str)).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );
}

export const buildEmbed = (
  embedTitle,
  description,
  baseUrl,
  imageUrl,
  footerText
) => {
  return {
    title: embedTitle,
    url: baseUrl,
    description: description,
    image: {
      url: imageUrl,
    },
    footer: {
      text: footerText,
    },
  };
};
