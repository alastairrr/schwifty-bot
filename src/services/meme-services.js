import MEME_BASE_PROPERTIES from "../meme-config.js";
import axios from "axios";
import { utf8ToBase64, prettify, buildEmbed } from "../utils.js";

function encodeCaptions(caption, captionSpacing) {
  return utf8ToBase64(prettify(caption, captionSpacing))
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export async function fetchCaption(baseUrl, episode, timeStamp) {
  try {
    const captionResponse = await axios.get(
      `${baseUrl}/api/caption?e=${episode}&t=${timeStamp}`
    );
    const captionData = captionResponse.data;

    if (captionData.Subtitles) {
      return captionData.Subtitles.map((item) => item.Content).join(" ");
    }
  } catch (error) {
    console.error("Error fetching search results:", error);
  }
  return "";
}

export async function fetchMeme(memeType, episode, timeStamp, caption) {
  const embedTitle = MEME_BASE_PROPERTIES[memeType].title;
  const baseUrl = MEME_BASE_PROPERTIES[memeType].baseUrl;
  const captionSpacing = MEME_BASE_PROPERTIES[memeType].captionSpacing;

  const encodedCaptions = encodeCaptions(caption, captionSpacing);

  return [
    buildEmbed(
      embedTitle,
      "",
      baseUrl,
      `${baseUrl}/meme/${episode}/${timeStamp}.jpg?b64lines=${encodedCaptions}`,
      `${episode} : ${timeStamp}`
    ),
  ];
}

export async function fetchGif(memeType, episode, timeStamp, caption) {
  const embedTitle = MEME_BASE_PROPERTIES[memeType].title;
  const baseUrl = MEME_BASE_PROPERTIES[memeType].baseUrl;
  const gifIndex = MEME_BASE_PROPERTIES[memeType].gif.index;
  const captionSpacing = MEME_BASE_PROPERTIES[memeType].captionSpacing;

  let finalGifUrl = "";

  try {
    const framesResponse = await axios.get(
      `${baseUrl}/api/frames/${episode}/${timeStamp}/${gifIndex}/${gifIndex}`
    );

    const firstFrame = framesResponse.data[0].Timestamp;
    const lastFrame =
      framesResponse.data[framesResponse.data.length - 1].Timestamp;

    const encodedCaptions = encodeCaptions(caption, captionSpacing);

    const gifResponse = await axios.get(
      `${baseUrl}/gif/${episode}/${firstFrame}/${lastFrame}.gif?b64lines=${encodedCaptions}`,
      {
        maxRedirects: 0, // Prevent Axios from following redirects
        validateStatus: (status) => {
          return status >= 200 && status < 400; // Accept 3xx status codes as valid
        },
      }
    );

    if (gifResponse.status >= 300 && gifResponse.status < 400) {
      finalGifUrl = gifResponse.headers.location; // Extract the 'Location' header
      console.log("Redirected to:", finalGifUrl);
    }
    return [
      buildEmbed(
        embedTitle,
        "",
        baseUrl,
        `${baseUrl}${finalGifUrl}`,
        `${episode} : ${timeStamp}`
      ),
    ];
  } catch (error) {
    console.error("Error fetching search results:", error);
    const status = error.response ? error.response.status : "unknown";
    return [
      buildEmbed(
        embedTitle,
        `An Error Occured: ${status}`,
        baseUrl,
        `${baseUrl}/meme/${episode}/${timeStamp}.jpg`,
        `${episode} : ${timeStamp}`
      ),
    ];
  }
}
