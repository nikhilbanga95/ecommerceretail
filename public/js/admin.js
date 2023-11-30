const deleteProduct = (btn) => {
  const prodId = btn.closest('div#edit-delete').children['productId'].value;
  const csrf = btn.closest('div#edit-delete').children['_csrf'].value;
  const productElement = btn.closest(`div#product-${prodId}`);
  fetch(`/admin/product/${prodId}`, {
    method: 'DELETE',
    headers: {
      'csrf-token': csrf
    },
  })
    .then(res => {
      return res.json()
    })
    .then(data=>{
      productElement.parentNode.removeChild(productElement);
    })
    .catch(err => console.error(err))
};