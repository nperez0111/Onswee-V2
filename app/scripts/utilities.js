Storage.prototype.setObj = function ( key, value ) {
    this.setItem( key, JSON.stringify( value ) );
};

Storage.prototype.getObj = function ( key ) {
    var value = this.getItem( key );
    return value && JSON.parse( value );
};

function compareNumbers( a, b ) {
    return a[ 0 ] - b[ 0 ];
}
//sorting of numbers in array

function compareNumber( a, b ) {
    return a - b;
}
//sorting of numbers

Array.prototype.clone = Array.prototype.clone || function () {
    return this.slice( 0 );
};
//provides a clone method for arrays

function allowDrop( ev ) {
    ev.preventDefault();
}

function goTo( which, link ) {
    var whiches = game.get( "which" );
    if ( whiches && whiches[ 0 ] == which ) {
        return;
    }

    $( whiches[ 0 ] ).slideUp( 'slow' );
    $( which ).slideDown( 'slow' );
    $( link ).addClass( 'active' );
    $( whiches[ 1 ] ).removeClass( 'active' );

    game.set( "which", [ which, link ] );

}
