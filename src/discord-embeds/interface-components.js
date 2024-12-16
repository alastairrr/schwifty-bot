import {
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  ButtonStyle,
  TextInputStyle,
} from "discord.js";

export default class MenuInterfaceComponents {
  constructor() {
    const createButtonComponent = (id, label, style) =>
      new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style);

    this.miscButtons = {
      _UI_FILLER: createButtonComponent(
        "_",
        "\u200B",
        ButtonStyle.Secondary
      ).setDisabled(true),
      CLOSE: createButtonComponent("close", "X", ButtonStyle.Danger),
      LEFT: createButtonComponent("left", "◄", ButtonStyle.Success),
      RIGHT: createButtonComponent("right", "►", ButtonStyle.Success),
    };

    this.selectionButtons = [
      createButtonComponent("1", "1", ButtonStyle.Primary),
      createButtonComponent("2", "2", ButtonStyle.Primary),
      createButtonComponent("3", "3", ButtonStyle.Primary),
      createButtonComponent("4", "4", ButtonStyle.Primary),
    ];

    this.generatorButtons = {
      CAPTION_EDIT: createButtonComponent(
        "caption-edit",
        "Edit Caption",
        ButtonStyle.Primary
      ),
      IMG: createButtonComponent("img", "Meme It", ButtonStyle.Primary),
      GIF: createButtonComponent("gif", "Gif It", ButtonStyle.Primary),
    };

    this.#buildButtonRows();
  }

  #buildButtonRows() {
    this.upperMainComponents = new ActionRowBuilder().addComponents(
      this.miscButtons.LEFT,
      this.selectionButtons[0],
      this.selectionButtons[1],
      this.miscButtons.RIGHT
    );

    this.lowerMainComponents = new ActionRowBuilder().addComponents(
      this.miscButtons._UI_FILLER,
      this.selectionButtons[2],
      this.selectionButtons[3],
      this.miscButtons.CLOSE
    );

    this.generatorComponents = new ActionRowBuilder().addComponents(
      this.generatorButtons.CAPTION_EDIT,
      this.generatorButtons.IMG,
      this.generatorButtons.GIF,
      this.miscButtons.CLOSE
    );

    this.finalComponents = new ActionRowBuilder().addComponents(
      this.miscButtons.CLOSE
    );
  }

  getMainComponents(currentPageNum, pageCount, pageSize) {
    this.selectionButtons.forEach((button, index) => {
      if (index >= pageSize) {
        button.setDisabled(true).setLabel("\u200B");
      } else {
        button.setDisabled(false).setLabel((index + 1).toString());
      }
    });

    if (currentPageNum === 1) {
      this.miscButtons.LEFT.setDisabled(true);
    } else {
      this.miscButtons.LEFT.setDisabled(false);
    }

    if (currentPageNum === pageCount) {
      this.miscButtons.RIGHT.setDisabled(true);
    } else {
      this.miscButtons.RIGHT.setDisabled(false);
    }

    return [this.upperMainComponents, this.lowerMainComponents];
  }

  getGeneratorComponents() {
    return [this.generatorComponents];
  }

  getFinalComponents() {
    return [this.finalComponents];
  }

  buildModal(interactionContext, defaultCaption) {
    const modal = new ModalBuilder()
      .setCustomId(
        `captionEditModal_${interactionContext.user.id}_${Date.now()}`
      )
      .setTitle("Edit Caption");

    const captionInput = new TextInputBuilder()
      .setCustomId("captionText")
      .setLabel("Enter your new caption:")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Type the new caption here...")
      .setValue(defaultCaption)
      .setRequired(false);

    const actionRow = new ActionRowBuilder().addComponents(captionInput);

    modal.addComponents(actionRow);

    return modal;
  }
}
