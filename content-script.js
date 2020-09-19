let tablePaneObserver;
let tablePaneNav;
let tablePaneNavElems;
let selectedNavText;
let filledOrdersObserver;
let ordersTableObserver;
let currSummaryTableRoot;
let buyClassName;
let sellClassName;

let data;
data = {};

const getTableRows = () => document.querySelectorAll('table tbody tr');

const showFilledOrdersSummary = (tableBodyElem) => {
  data = {};

  [...tableBodyElem.querySelectorAll('tr')].forEach((row, i) => {
    // console.log({ length: row.cells.length });
    // console.log({ cells: row.cells });

    if (row.cells.length == 13 || row.cells.length == 15) {
      r = {
        ticker: row.cells[1].textContent,
        buySell: row.cells[3].textContent,
        numShares: +row.cells[4].textContent,
        price: +row.cells[8].textContent,
        filledDate: row.cells[12].textContent.split(' ')[0],
      };
    } else {
      if (!(row.cells.length === 16 || row.cells.length === 17)) {
        console.error('Please verify the column order of this ' + row.cells.length + '-celled row', row.cells);
        return;
      }

      r = {
        ticker: row.cells[1].textContent,
        buySell: row.cells[3].textContent,
        numShares: +row.cells[5].textContent,
        filledDate: row.cells[6].textContent.split(' ')[0],
        price: +row.cells[8].textContent,
      };
    }

    if (!(r.numShares > 0)) {
      return;
    }

    // console.log(r);

    // Capture the Buy & Sell CSS class names
    if (r.buySell === 'Buy' && !buyClassName)
      buyClassName = row.cells[3].firstChild.className;
    else if (r.buySell === 'Sell' && !sellClassName)
      sellClassName = row.cells[3].firstChild.className;

    if (!data[r.ticker]) data[r.ticker] = { [r.filledDate]: null };
    if (!data[r.ticker][r.filledDate]) data[r.ticker][r.filledDate] = { rows: [] };
    if (!data[r.ticker][r.filledDate][r.buySell]) data[r.ticker][r.filledDate][r.buySell] = { totShares: 0, totPrice: 0 };

    tickerData = data[r.ticker][r.filledDate][r.buySell];
    tickerData.totShares += r.numShares;
    tickerData.totPrice = (Number(tickerData.totPrice) + r.numShares * r.price).toFixed(2);
    tickerData.avgPrice = Number((tickerData.totPrice / tickerData.totShares).toFixed(3));

    data[r.ticker][r.filledDate][r.buySell] = tickerData;
    data[r.ticker][r.filledDate].rows.push(r);
  });

  displaySummaryDataTable(data, tableBodyElem.parentElement);
  console.log(data);
};

const removeAnyExistingOrderSummaryTable = () => {
  currSummaryTableRoot?.remove?.();
};

const displaySummaryDataTable = (data, tableNode) => {
  removeAnyExistingOrderSummaryTable();

  const tableClone = tableNode.parentElement.cloneNode(true);

  tableClone.id = 'jdunk-order-totals-table';
  tableClone.style.marginBottom = '20px';
  tableClone.firstChild.style.width = 'auto';

  // First, remove all body rows except one (which will be used as a template)
  [...tableClone.firstChild.querySelectorAll('tbody > tr:not(:first-child)')]
    .forEach(e => e.remove());

  // Next, remove the unnecessary first column
  [...tableClone.firstChild.querySelectorAll('colgroup > :first-child, thead > tr > :first-child, tbody > tr > :first-child')]
    .forEach(e => e.remove());

  // Next, set { left: 0 } on every first-column cell (to override { left: 30px })
  [...tableClone.firstChild.querySelectorAll('thead > tr > :first-child, tbody > tr > :first-child')]
    .forEach((el) => { el.style.left = 0; });

  // Repurpose columns...

  // Change 2nd column's name and width
  tableClone.querySelector('thead > tr > th:nth-child(2) > span > span:first-child').innerText = 'Date';
  tableClone.querySelector('colgroup > col:nth-child(2)').width = '110px';

  // Change 3rd column's width ("Side")
  tableClone.querySelector('colgroup > col:nth-child(3)').width = '40px';

  // Change 4th column's name and width
  tableClone.querySelector('thead > tr > th:nth-child(4) > span > span:first-child').innerText = 'Total Qty';
  tableClone.querySelector('colgroup > col:nth-child(4)').width = '70px';

  // Change 5th column's name and width
  tableClone.querySelector('thead > tr > th:nth-child(5) > span > span:first-child').innerText = 'Total Price';
  tableClone.querySelector('colgroup > col:nth-child(5)').width = '90px';

  // Change 6th column's name and width
  tableClone.querySelector('thead > tr > th:nth-child(6) > span > span:first-child').innerText = 'Avg Price';
  tableClone.querySelector('colgroup > col:nth-child(6)').width = '80px';

  // Delete all columns beyond 6
  let notStr = '';
  for (i = 1; i <= 6; i++) {
    notStr += `:not(:nth-child(${i}))`;
  }

  [...tableClone.firstChild.querySelectorAll(`colgroup > col${notStr}, thead > tr > ${notStr}, tbody > tr > ${notStr}`)]
    .forEach(e => e.remove());

  // Now fill the body rows with proper data
  const firstRow = tableClone.firstChild.querySelector('tbody > tr');

  Object.keys(data).forEach((symbol) => {
    Object.keys(data[symbol]).forEach((strDate) => {
     Object.keys(data[symbol][strDate]).forEach((key) => {
        if (key !== 'Buy' && key !== 'Sell')
          return;

        const newRow = firstRow.cloneNode(true);
        const rowData = data[symbol][strDate][key];

        newRow.children[0].children[0].innerText = symbol;
        newRow.children[1].children[0].innerText = strDate;
        newRow.children[2].children[0].innerText = key;
        newRow.children[2].children[0].className = key === 'Buy' ? buyClassName : sellClassName;
        newRow.children[3].children[0].innerText = rowData.totShares;
        newRow.children[4].children[0].innerText = rowData.totPrice;
        newRow.children[5].children[0].innerText = rowData.avgPrice;

        tableClone.firstChild.tBodies[0].append(newRow);
      });
    });
  });

  // Finally, remove the first (template) row
  firstRow.remove();

  tableNode.parentElement.parentElement.prepend(tableClone);
  currSummaryTableRoot = tableClone;
};

const getYoungestAncestorWithOlderSibling = (elem) => {
  let currElem = elem;

  while (currElem && !currElem.previousElementSibling) {
    currElem = currElem.parentElement;
  }

  return currElem && currElem.previousElementSibling;
};

const tablePaneNavElemIsSelected = (elem) => {
  const currColor = window.getComputedStyle(elem).color;
  const currColorPieces = currColor.split(',');
  return currColorPieces.length === 3 || (currColorPieces.length === 4 && currColorPieces[3] !== ' 0.7)');
};

const watchForOrdersTable = () => {
  waitForTableElem().then((tableNode) => {
    if (selectedNavText === "Today's Orders") {
      const todaysOrdersSubsectionHeader = getYoungestAncestorWithOlderSibling(tableNode);

      if (todaysOrdersSubsectionHeader.textContent !== 'Working Orders') {
        console.error('Error: "Working Orders" section not found');
        return;
      }

      watchForFilledOrdersTable(todaysOrdersSubsectionHeader.parentElement.nextElementSibling);
      return;
    }

    // "Order History" table
    observeOrdersTable(tableNode);
  });
};

const watchForFilledOrdersTable = (filledOrdersSectionNode) => {
  if (!filledOrdersObserver) {
    filledOrdersObserver = new MutationObserver((mutations) => {
      const tableElem = mutations.reduce((result, mutation) => mutation.target?.tagName === 'TABLE' ? mutation.target : null);

      if (!tableElem) return;

      filledOrdersObserver.disconnect();

      showFilledOrdersSummary(tableElem?.tBodies?.[0]);
      observeOrdersTable(tableElem);
    });
    filledOrdersObserver.observe(
      filledOrdersSectionNode,
      { childList: true, subtree: true }
    );
  }
};

const observeOrdersTable = (ordersTableNode) => {
  ordersTableObserver?.disconnect?.();

  ordersTableObserver = new MutationObserver((mutations) => {
    const tableBodyElem = mutations
      .map((mutation) => {
        if (mutation.addedNodes?.[0]?.tagName === 'TBODY')
          return mutation.addedNodes[0];

        return mutation.target.tagName === 'TBODY' ? mutation.target : null;
      }).find(x => x);

    if (!tableBodyElem) return;

    showFilledOrdersSummary(tableBodyElem);
  });
  ordersTableObserver.observe(
    ordersTableNode,
    { childList: true, subtree: true }
  );

  if (ordersTableNode.tBodies?.length)
    showFilledOrdersSummary(ordersTableNode.tBodies[0]);
};

const waitForTableElem = () => {
  return new Promise((resolve) => {
    const getTableElem = () => {
      const tableNodes = document.querySelectorAll('table');

      if (!tableNodes?.length) {
        setTimeout(() => {
          getTableElem();
        }, 1500)
        return;
      }

      if (tableNodes.length > 1) {
        console.error('More than one table found! Unknown layout. Bug(s) possible.');
        alert('More than one table found! Unknown layout. Bug(s) possible.');
      }

      resolve(tableNodes[0]);
    };

    getTableElem();
  });
};

const init = () => {

  if (tablePaneObserver) return;

  waitForTableElem().then((tableNode) => {
    tablePaneNav = getYoungestAncestorWithOlderSibling(tableNode);
    tablePaneNavElems = tablePaneNav?.querySelectorAll?.('[data-selectid]');

    if (!tablePaneNav || !tablePaneNavElems || tablePaneNavElems[0]?.textContent !== 'My Positions') {
      setTimeout(() => {
        watchForFirstTable();
      }, 1500)
      return;
    }

    tablePaneObserver = new MutationObserver((mutations) => {
      const selectedNavElem = [...tablePaneNavElems].find(elem => tablePaneNavElemIsSelected(elem));
      selectedNavText = selectedNavElem.textContent;

      if (selectedNavText === "Today's Orders" || selectedNavText === "Order History")
        watchForOrdersTable();
    });
    tablePaneObserver.observe(
      tablePaneNavElems[0].parentElement,
      { childList: true, subtree: true, characterData: true, attributes: true }
    );
  });
};

init();