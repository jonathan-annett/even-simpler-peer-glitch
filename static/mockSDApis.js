
const mockSD = {

    fn : {},

    db : {}

};


function mockSDApi(){

    return {
        sendToPropertyInspector,
        onSendToPlugin
    };

    function sendToPropertyInspector(payload) {
        if (mockSD.fn.pi) {
            mockSD.fn.pi(payload); 
        } else {
            mockSD.db.pi=payload;
        }
    }

    function onSendToPlugin(fn) {
        if (mockSD.db.plugin) {
            fn(mockSD.db.plugin);
            delete mockSD.db.plugin;
        }
        mockSD.fn.plugin = fn;
    }


}

function mockPIApi(){

    return {
        sendToPlugin,
        onSendToPropertyInspector
    };

    function sendToPlugin(payload) {
        if (mockSD.fn.plugin) {
            mockSD.fn.plugin(payload); 
        } else {
            mockSD.db.plugin=payload;
        }
    }

    function onSendToPropertyInspector(fn) {
        if (mockSD.db.pi) {
            fn(mockSD.db.pi);
            delete mockSD.db.pi;
        }
        mockSD.fn.pi = fn;
    }


}