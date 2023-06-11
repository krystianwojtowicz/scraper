const axios = require("axios");
const cheerio = require("cheerio");
const url = "https://ecoshine.sklep.pl/";
const express = require("express");
const PORT = 8000;
let productNames = [];
const app = express();

function searchSpecificElement(page, selector, keyword) {
  const specificElements = page(selector).filter((_, element) => {
    const productName = page(element).text().toLowerCase();
    return productName.includes(keyword.toLowerCase());
  });

  return specificElements;
}

function processElements(specificElements, page, index, productNames) {
  specificElements.each((_, element) => {
    const parent = page(element).parent().parent();
    const elementWithPrice = parent.find(".price.f-row");
    const emWithPrice = elementWithPrice.find("em");
    const price = emWithPrice.text();
    const productName = page(element).text();

    productNames.push({
      name: productName,
      page: index,
      price: price,
    });
  });
}

axios(url).then((res) => {
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
      processElements(specificElements, linked$, 1, productNames);
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
          processElements(specificElements, nextPage$, index, productNames);
        }
        if (index <= trimmedElements.length) {
          index++;
          searching(index);
        } else {
          if (productNames.length > 0) {
            productNames.sort((a, b) => {
              const priceA = parseFloat(a.price.replace(/[^0-9.-]+/g, ""));
              const priceB = parseFloat(b.price.replace(/[^0-9.-]+/g, ""));
              return priceA - priceB;
            });

            console.log(productNames);
          } else {
            console.log("Product not found");
          }
        }
      });
    };

    searching(index);
  });
});

app.get("/", (req, res) => {
  // Handle the request for the root URL ("/") here
  // You can perform your scraping logic and send the response
  // axios(url).then((response) => {
  //   // Handle the response and send the appropriate data
  //   res.send("Hello, world!"); // Example response, you can replace this with your own logic
  // });
  res.send(productNames);
});

app.listen(PORT);
