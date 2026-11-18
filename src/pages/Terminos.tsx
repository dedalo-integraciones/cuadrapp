import React from 'react';
import LegalShell, { direccionCompleta, precioEnPesos } from '../components/LegalShell';
import type { TenantPublico } from '../types';

const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="pt-2 text-sm font-black text-stone-900">{children}</h2>
);

/** Términos y condiciones generados con los datos del negocio (tenant). */
const Terminos: React.FC = () => (
  <LegalShell titulo="Términos y condiciones">
    {(tenant: TenantPublico) => {
      const legal = tenant.legal;
      const domicilio = direccionCompleta(tenant);
      const contacto = [
        tenant.email_contacto ? `email ${tenant.email_contacto}` : '',
        tenant.telefono ? `teléfono ${tenant.telefono}` : '',
      ]
        .filter(Boolean)
        .join(' y ');

      return (
        <>
          <H2>1. Titular y vendedor</H2>
          <p>
            Este sitio es operado por <strong>{legal.razon_social}</strong>, que comercia
            como <strong>{tenant.name}</strong>
            {legal.documento_fiscal ? `, CUIT ${legal.documento_fiscal}` : ''}, con
            domicilio en {domicilio}. Es el vendedor y responsable de los productos y
            servicios que se publican y se piden por este medio.
          </p>
          <p>
            Contacto: {contacto}.
            {tenant.horario_atencion ? ` Horario de atención: ${tenant.horario_atencion}.` : ''}
          </p>

          <H2>2. La plataforma</H2>
          <p>
            El sitio funciona con Cuadra, una plataforma desarrollada y comercializada por
            Dédalo Integraciones (
            <a
              href="https://dedalointegraciones.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#C8180F] underline"
            >
              dedalointegraciones.vercel.app
            </a>
            ). Dédalo Integraciones no es vendedor, no participa en la preparación, el cobro
            ni la entrega de los pedidos y no responde por el contenido, los precios, la
            disponibilidad ni las condiciones publicadas por el negocio.
          </p>

          <H2>3. Pedidos</H2>
          <p>
            Los pedidos se hacen por WhatsApp desde el carrito de la tienda. El sitio no
            crea cuentas, no cobra en línea y no guarda pedidos: la conversación y la
            confirmación quedan entre vos y el negocio. El pedido se considera aceptado
            cuando el negocio lo confirma por ese mismo canal.
          </p>

          <H2>4. Precios y disponibilidad</H2>
          <p>
            Los precios se muestran en pesos argentinos. El valor vigente es el publicado al
            momento de la consulta; puede cambiar sin aviso previo y la disponibilidad se
            confirma al cerrar el pedido. Si hay una diferencia, el negocio te lo informa
            antes de preparar el pedido.
          </p>

          <H2>5. Entrega</H2>
          {legal.entrega_retiro && (
            <p>
              <strong>Retiro en el local:</strong> {domicilio}
              {tenant.horario_atencion ? `, en el horario ${tenant.horario_atencion}` : ''}.
            </p>
          )}
          {legal.entrega_envio && (
            <p>
              <strong>Envío a domicilio:</strong> zonas {legal.entrega_zonas}. Demora
              estimada: {legal.entrega_demora}. Costo: {precioEnPesos(
                legal.envio_costo_cents,
                tenant.moneda_simbolo
              )}.
            </p>
          )}

          <H2>6. Cambios y devoluciones</H2>
          <p>
            Plazo: {legal.cambios_plazo_dias} días. {legal.cambios_condiciones}
          </p>

          {legal.vende_alcohol && (
            <>
              <H2>7. Edad mínima y alcohol</H2>
              <p>
                La venta de bebidas alcohólicas se realiza únicamente a personas mayores de
                18 años. El negocio puede pedir documento antes de entregar el pedido y se
                reserva el derecho de rechazarlo si no se acredita la edad. Está prohibida
                la venta a menores. Se promueve el consumo responsable.
              </p>
            </>
          )}

          <H2>{legal.vende_alcohol ? '8' : '7'}. Medios de pago</H2>
          <p>{legal.medios_pago}</p>

          <H2>{legal.vende_alcohol ? '9' : '8'}. Propiedad intelectual</H2>
          <p>
            El nombre, el catálogo, las imágenes y los textos del negocio pertenecen a{' '}
            {legal.razon_social} o se usan con autorización. La marca Cuadra, el software y
            la tecnología de la plataforma pertenecen a Dédalo Integraciones.
          </p>

          <H2>{legal.vende_alcohol ? '10' : '9'}. Responsabilidad</H2>
          <p>
            {legal.razon_social} responde por la legalidad de los productos, la información
            publicada y el cumplimiento del pedido. Dédalo Integraciones presta el servicio
            técnico de la plataforma y no responde por la relación comercial entre el
            negocio y sus clientes.
          </p>

          <H2>{legal.vende_alcohol ? '11' : '10'}. Datos personales</H2>
          <p>
            El tratamiento de datos se explica en la{' '}
            <a href="/privacidad" className="font-bold text-[#C8180F] underline">
              política de privacidad
            </a>
            .
          </p>

          <H2>{legal.vende_alcohol ? '12' : '11'}. Ley aplicable y jurisdicción</H2>
          <p>
            Estos términos se rigen por la legislación de la República Argentina y por la
            jurisdicción de {legal.jurisdiccion}. Nada de lo aquí escrito limita los
            derechos que la Ley 24.240 de Defensa del Consumidor reconoce a los
            consumidores.
          </p>

          {legal.condiciones_extra && (
            <>
              <H2>{legal.vende_alcohol ? '13' : '12'}. Condiciones adicionales</H2>
              <p>{legal.condiciones_extra}</p>
            </>
          )}
        </>
      );
    }}
  </LegalShell>
);

export default Terminos;
