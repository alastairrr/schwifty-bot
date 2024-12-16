import { buildEmbed } from "../utils.js";

class EmbedPage {
  #contents = [];
  constructor(pageContents, currentPageNum, totalPageCount) {
    if (!Array.isArray(pageContents)) {
      throw new TypeError("pageContents must be an array");
    }
    this.#contents = pageContents;
    this.currentPageNum = currentPageNum;
    this.totalPageCount = totalPageCount;
  }

  get pageLength() {
    return this.#contents.length;
  }

  get pageContents() {
    return this.#contents;
  }

  getEmbedObjectByID(index) {
    if (index >= 0 && index < this.#contents.length) {
      return this.#contents[index];
    } else {
      return {};
    }
  }
}

export default class EmbedPaginator {
  #startIdx = 0;
  #increment = 4;
  #pageNum = 1;

  constructor(title, baseUrl, resourceSet) {
    this.baseUrl = baseUrl;
    this.embedArray = resourceSet.map((item, index) =>
      buildEmbed(
        title,
        "",
        this.baseUrl,
        `${this.baseUrl}/img/${item.Episode}/${item.Timestamp}/medium.jpg`,
        `${Math.ceil((index + 1) / this.#increment)} of ${Math.ceil(
          resourceSet.length / this.#increment
        )}`
      )
    );
  }

  get pageCount() {
    return Math.ceil(this.embedArray.length / this.#increment);
  }

  get currentPageNum() {
    return this.#pageNum;
  }

  getCurrentPage() {
    const currentResourceSet = this.embedArray.slice(
      this.#startIdx,
      this.#startIdx + this.#increment
    );
    return new EmbedPage(currentResourceSet, this.#pageNum, this.pageCount);
  }

  getNextPage() {
    if (this.#startIdx + this.#increment < this.embedArray.length) {
      this.#startIdx += this.#increment;
      this.#pageNum += 1;
    }

    return this.getCurrentPage();
  }

  getPrevPage() {
    if (this.#startIdx > 0) {
      this.#startIdx -= this.#increment;
      this.#pageNum -= 1;
    }
    return this.getCurrentPage();
  }
}
