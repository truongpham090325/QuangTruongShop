export const formatProductItem = (item: any) => {
  // giảm giá
  item.discount = Math.floor(
    ((item.priceOld - item.priceNew) / item.priceOld) * 100,
  );

  const colorSet = new Set();
  item.variants
    .filter((variant: any) => variant.status == true)
    .forEach((variant: any) => {
      variant.attributeValue.forEach((attr: any) => {
        if (attr.attrType == "color") {
          colorSet.add(attr.value);
        }
      });
    });

  item.colorList = [...colorSet];
};
