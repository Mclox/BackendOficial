// Memoria temporal simulando una BD
let landingConfig = {
    logo: '',
    businessName: 'Barbería Elite',
    heroTitle: 'El Arte de la Barbería Clásica',
    heroSubtitle: 'Estilo • Elegancia • Excelencia'
};

class LandingController {
    static getConfig(req, res) {
        res.json({ success: true, data: landingConfig });
    }

    static updateConfig(req, res) {
        // Actualiza las llaves que vengan en el body
        landingConfig = { ...landingConfig, ...req.body };
        res.json({ success: true, message: 'Configuración actualizada', data: landingConfig });
    }
}
module.exports = LandingController;