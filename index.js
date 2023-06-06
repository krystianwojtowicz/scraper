const axios = require("axios");
const cheerio = require("cheerio");
const url = "https://ecoshine.sklep.pl/";

axios(url).then((res) => {
  const html = res.data;
  const $ = cheerio.load(html);
  const elementWithTitle = $('a[title="CHEMIA OBIEKTOWA"]');
  let link = elementWithTitle.attr("href");
  link = link.substring(1);
  axios(url + link).then((res) => {
    const linkedHTML = res.data;
    const linked$ = cheerio.load(linkedHTML);
    const specificElement = linked$(
      '.productname:contains("ACTIVE CLEAN 10L - Koncentrat aktywnego preparatu silnie myjącego")'
    );
    // if (specificElement.length > 0) {
    //   const parent = specificElement.parent().parent();
    //   const elementWithPrice = parent.find(".price.f-row");
    //   const emWithPrice = elementWithPrice.find("em");
    //   const price = emWithPrice.text();
    //   console.log(price);
    // } else {
    const ulElement = linked$("ul.paginator");
    const paginator = ulElement.eq(1);
    const children = paginator.find("li");
    const childrenArray = children.toArray();
    childrenArray.shift();
    childrenArray.pop();
    const modifiedChildren = linked$(childrenArray);
    const oddElements = modifiedChildren.filter((index) => index % 2 === 0);
    const trimmedElements = oddElements.slice(1);
    trimmedElements.each((index, element) => {
      console.log(linked$(element).text());
    });
    // }
  });
});
