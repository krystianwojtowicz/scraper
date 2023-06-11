const axios = require("axios");
const cheerio = require("cheerio");
const url = "https://ecoshine.sklep.pl/";

function searchSpecificElement(page, selector, keyword) {
  const specificElements = page(selector).filter((_, element) => {
    const productName = page(element).text().toLowerCase();
    return productName.includes(keyword.toLowerCase());
  });

  return specificElements;
}

axios(url).then((res) => {
  let productNames = [];
  const html = res.data;
  const $ = cheerio.load(html);
  const elementWithTitle = $('a[title="CHEMIA OBIEKTOWA"]');
  let link = elementWithTitle.attr("href");
  link = link.substring(1);
  axios(url + link).then((res) => {
    const linkedHTML = res.data;
    const linked$ = cheerio.load(linkedHTML);
    let searchKeyword = "disher";
    searchKeyword = searchKeyword.toLowerCase(searchKeyword);
    const specificElements = searchSpecificElement(
      linked$,
      ".productname",
      searchKeyword
    );
    if (specificElements.length > 0) {
      specificElements.each((_, element) => {
        const parent = linked$(element).parent().parent();
        const elementWithPrice = parent.find(".price.f-row");
        const emWithPrice = elementWithPrice.find("em");
        const price = emWithPrice.text();
        const productName = linked$(element).text();
        productNames.push({
          name: productName,
          page: 1,
          price: price,
        });
      });
    }
    const ulElement = linked$("ul.paginator");
    const paginator = ulElement.eq(1);
    const children = paginator.find("li");
    const childrenArray = children.toArray();
    childrenArray.shift();
    childrenArray.pop();
    const modifiedChildren = linked$(childrenArray);
    const oddElements = modifiedChildren.filter((index) => index % 2 === 0);
    const trimmedElements = oddElements.slice(1);

    let nextPageLink = trimmedElements.eq(0).find("a").attr("href");
    nextPageLink = nextPageLink.substring(1);
    nextPageLink = nextPageLink.slice(0, -1);
    let index = 2;

    const searching = (index) => {
      axios(url + nextPageLink + index).then((res) => {
        const nextPageHTML = res.data;
        const nextPage$ = cheerio.load(nextPageHTML);
        const specificElements = searchSpecificElement(
          nextPage$,
          ".productname",
          searchKeyword
        );
        if (specificElements.length > 0) {
          specificElements.each((_, element) => {
            const parent = nextPage$(element).parent().parent();
            const elementWithPrice = parent.find(".price.f-row");
            const emWithPrice = elementWithPrice.find("em");
            const price = emWithPrice.text();
            const productName = nextPage$(element).text();
            productNames.push({
              name: productName,
              page: index,
              price: price,
            });
          });
        }
        if (index <= trimmedElements.length) {
          index++;
          searching(index);
        } else {
          productNames
            ? console.log(productNames)
            : console.log("product not found");
        }
      });
    };

    searching(index);
  });
});
