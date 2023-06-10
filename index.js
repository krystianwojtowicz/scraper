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
  const foundElements = [];
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
    const specificElement = searchSpecificElement(
      linked$,
      ".productname",
      searchKeyword
    );
    if (specificElement.length > 0) {
      const parent = specificElement.parent().parent();
      const elementWithPrice = parent.find(".price.f-row");
      const emWithPrice = elementWithPrice.find("em");
      const price = emWithPrice.text();
      //   console.log(price);
      //   console.log(specificElement);
      const productNames = specificElement
        .map((_, element) => linked$(element).text())
        .get();
      console.log("Products found:");
      console.log(productNames);
    } else {
      const ulElement = linked$("ul.paginator");
      const paginator = ulElement.eq(1);
      const children = paginator.find("li");
      const childrenArray = children.toArray();
      childrenArray.shift();
      childrenArray.pop();
      const modifiedChildren = linked$(childrenArray);
      const oddElements = modifiedChildren.filter((index) => index % 2 === 0);
      const trimmedElements = oddElements.slice(1);

      let secondPageLink = trimmedElements.eq(0).find("a").attr("href");
      secondPageLink = secondPageLink.substring(1);
      secondPageLink = secondPageLink.slice(0, -1);
      let index = 2;

      const searching = (index) => {
        axios(url + secondPageLink + index).then((res) => {
          const secondPageHTML = res.data;
          const secondPage$ = cheerio.load(secondPageHTML);
          const specificElements = searchSpecificElement(
            secondPage$,
            ".productname",
            searchKeyword
          );
          if (specificElements.length > 0) {
            specificElements.each((_, element) => {
              foundElements.push(secondPage$(element));
              //   foundElements.push(secondPage$(element).text());
            });
            console.log("Products found on page " + index);
            console.log(foundElements);
          } else {
            if (index <= trimmedElements.length) {
              index++;
              searching(index);
            } else {
              console.log("No more products found");
              console.log(foundElements);
            }
          }
        });
      };

      searching(index);
    }
  });
});
