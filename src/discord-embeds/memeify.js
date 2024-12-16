import { ComponentType } from "discord.js";

import MenuInterfaceComponents from "./interface-components.js";
import axios from "axios";
import MEME_BASE_PROPERTIES from "../meme-config.js";
import {
  fetchCaption,
  fetchMeme,
  fetchGif,
} from "../services/meme-services.js";
import EmbedPaginator from "../services/paginator.js";

async function navigationInteractionUpdate(
  interactionContext,
  newEmbedPage,
  interfaceComponents
) {
  await interactionContext.update({
    embeds: newEmbedPage.pageContents,
    components: interfaceComponents.getMainComponents(
      newEmbedPage.currentPageNum,
      newEmbedPage.totalPageCount,
      newEmbedPage.pageLength
    ),
  });
}

async function selectionInteractionUpdate(interactionContext, paginatedEmbeds) {
  const selectionId = parseInt(interactionContext.customId, 10); // Convert customId to a number

  if (isNaN(selectionId) || selectionId < 1 || selectionId > 4) {
    throw new Error("Invalid selection ID provided.");
  }

  const selectedEmbed = paginatedEmbeds
    .getCurrentPage()
    .getEmbedObjectByID(selectionId - 1);

  const extractedMetaData = selectedEmbed.image.url
    .slice(`${paginatedEmbeds.baseUrl}/img/`.length)
    .trim()
    .split("/");
  const episode = extractedMetaData[0];
  const timeStamp = extractedMetaData[1];

  selectedEmbed.footer.text = `${episode} : ${timeStamp}`;

  const captionText = await fetchCaption(
    paginatedEmbeds.baseUrl,
    episode,
    timeStamp
  );

  return {
    embedObject: selectedEmbed,
    episode: episode,
    timeStamp: timeStamp,
    caption: captionText,
  };
}

async function memeGenerationInteractionUpdate(
  interactionContext,
  memeType,
  embedMetaData,
  contentType,
  interfaceComponents
) {
  if (
    embedMetaData === null ||
    !embedMetaData.embedObject ||
    !embedMetaData.episode ||
    !embedMetaData.timeStamp
  ) {
    throw new Error("Invalid embedMetaData provided.");
  }

  if (contentType !== "img" && contentType !== "gif") {
    return;
  }

  embedMetaData.embedObject.description = `Loading final ${contentType}...`;
  await interactionContext.deferUpdate();

  await interactionContext.editReply({
    embeds: [embedMetaData.embedObject],
    components: interfaceComponents.getFinalComponents(),
  });
  let finalEmbed = [];

  if (contentType === "gif") {
    finalEmbed = await fetchGif(
      memeType,
      embedMetaData.episode,
      embedMetaData.timeStamp,
      embedMetaData.caption
    );
  } else if (contentType === "img") {
    finalEmbed = await fetchMeme(
      memeType,
      embedMetaData.episode,
      embedMetaData.timeStamp,
      embedMetaData.caption
    );
    console.log(finalEmbed);
  }
  try {
    await interactionContext.editReply({
      content: "",
      embeds: finalEmbed,
      components: interfaceComponents.getFinalComponents(),
    });
  } catch (error) {
    if (error.code === 10008) {
      console.error("Message not found or already deleted.");
    } else {
      console.error("An unexpected error occurred:", error);
    }
  }
}

async function modalCaptionSubmission(interactionContext) {
  let modalCaptionText = "";

  const submitted = await interactionContext
    .awaitModalSubmit({
      time: 300_000,
      filter: (i) =>
        i.user.id === interactionContext.user.id &&
        i.message.id === interactionContext.message.id,
    })
    .catch((error) => {
      // Catch any Errors that are thrown (e.g. if the awaitModalSubmit times out after 60000 ms)
      console.log(error);
    });

  if (submitted) {
    modalCaptionText = submitted.fields.getTextInputValue("captionText");
    submitted.deferUpdate().catch(console.error);
  }

  return modalCaptionText;
}

async function replyEmbed(memeType, msg, resourceSet) {
  const baseUrl = MEME_BASE_PROPERTIES[memeType].baseUrl;
  const embedTitle = MEME_BASE_PROPERTIES[memeType].title;

  const paginatedEmbeds = new EmbedPaginator(embedTitle, baseUrl, resourceSet);
  const interfaceComponents = new MenuInterfaceComponents();

  const currentPage = paginatedEmbeds.getCurrentPage();
  const messageUserResponse = await msg.reply({
    embeds: currentPage.pageContents,
    components: interfaceComponents.getMainComponents(
      currentPage.currentPageNum,
      currentPage.totalPageCount,
      currentPage.pageLength
    ),
  });

  const collectorFilter = (i) => i.user.id === msg.author.id;

  const collector = messageUserResponse.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: collectorFilter,
  });

  let embedMetaData = {
    embedObject: {},
    episode: "",
    timeStamp: "",
    caption: "",
  };
  let activeModal;

  collector.on("collect", async (interaction) => {
    try {
      if (interaction.isButton()) {
        switch (interaction.customId) {
          case "left":
            await navigationInteractionUpdate(
              interaction,
              paginatedEmbeds.getPrevPage(),
              interfaceComponents
            );
            break;

          case "right":
            await navigationInteractionUpdate(
              interaction,
              paginatedEmbeds.getNextPage(),
              interfaceComponents
            );
            break;

          case "1":
          case "2":
          case "3":
          case "4":
            embedMetaData = await selectionInteractionUpdate(
              interaction,
              paginatedEmbeds,
              interfaceComponents
            );
            await interaction.update({
              embeds: [embedMetaData.embedObject],
              components: interfaceComponents.getGeneratorComponents(),
            });
            break;

          case "caption-edit": {
            if (!activeModal) {
              activeModal = interfaceComponents.buildModal(
                interaction,
                embedMetaData.caption
              );
              interaction.showModal(activeModal);
              embedMetaData.caption = await modalCaptionSubmission(interaction);
              activeModal = null;
            } else {
              interaction.showModal(activeModal);
            }

            break;
          }

          case "img":
          case "gif": {
            const contentType = interaction.customId;
            await memeGenerationInteractionUpdate(
              interaction,
              memeType,
              embedMetaData,
              contentType,
              interfaceComponents
            );
            break;
          }

          case "close":
            messageUserResponse.delete();

            return;

          default:
            return;
        }
      }
    } catch (e) {
      console.log(e);
    }
  });
}

export async function memeify(memeType, msg) {
  if (!Object.hasOwn(MEME_BASE_PROPERTIES, memeType)) {
    throw new Error(
      `Invalid memeify type: '${memeType}', available types: [${Object.keys(
        MEME_BASE_PROPERTIES
      )}].`
    );
  }

  const query = encodeURIComponent(msg.content.slice(memeType.length).trim());
  let searchResponseData = [];

  try {
    const searchMeme = await axios.get(
      `${MEME_BASE_PROPERTIES[memeType].baseUrl}/api/search?q=${query}`
    );
    searchResponseData = searchMeme.data;
  } catch (error) {
    console.error("Error fetching search results:", error);
    const status = error.response ? error.response.status : "unknown";
    msg.reply({ content: `An error occured ${status}.` });
  }

  if (searchResponseData.length) {
    replyEmbed(memeType, msg, searchResponseData);
  } else {
    msg.reply({ content: "No results found." });
  }
}
