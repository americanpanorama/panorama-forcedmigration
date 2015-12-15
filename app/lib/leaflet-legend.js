if(typeof(L) !== 'undefined') {


  L.MapKey = L.Control.extend({
    options: {
        position: 'bottomright',
        items: [],
        html: true
    },

    onAdd: function (map) {
        // create the control container with a particular class name
        var container = L.DomUtil.create('div', 'leaflet-map-key');

        var that = this;
        this.options.items.forEach(function(item) {
          var klass = 'key-item' + (item.klass ? ' ' + item.klass : '');

          var elm = L.DomUtil.create('div', klass, container);
          if (that.options.html) {
            elm.innerHTML = item.content;
          } else {
            var text = elm.textContent || elm.innerText;
            text = item.content;
          }
        });

        return container;
    }

  });

}
