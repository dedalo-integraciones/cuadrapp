import React from 'react';
import LegalShell, { direccionCompleta } from '../components/LegalShell';
import type { TenantPublico } from '../types';

const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="pt-2 text-sm font-black text-stone-900">{children}</h2>
);

/** Política de privacidad y cookies generada con los datos del negocio. */
const Privacidad: React.FC = () => (
  <LegalShell titulo="Política de privacidad y cookies">
    {(tenant: TenantPublico) => {
      const legal = tenant.legal;
      const contacto = tenant.email_contacto || '';

      return (
        <>
          <H2>1. Responsable del tratamiento</H2>
          <p>
            <strong>{legal.razon_social}</strong>, que comercia como{' '}
            <strong>{tenant.name}</strong>
            {legal.documento_fiscal ? `, documento fiscal ${legal.documento_fiscal}` : ''}, con
            domicilio en {direccionCompleta(tenant)}, es el responsable de los datos
            personales que recibe a través de los pedidos y consultas.
            {contacto ? ` Contacto: ${contacto}.` : ''}
          </p>

          <H2>2. Qué datos se tratan</H2>
          <p>
            Este sitio no tiene registro de usuarios ni guarda pedidos. Cuando decide
            hacer un pedido, los datos que escribe (nombre, dirección, teléfono y detalle
            del pedido) viajan por WhatsApp al negocio. El sitio no recibe ni almacena esa
            conversación.
          </p>
          <p>
            Además, el servidor puede registrar datos técnicos mínimos (dirección IP, fecha
            y tipo de solicitud) para seguridad, diagnóstico de errores y prevención de
            abuso.
          </p>

          <H2>3. Para qué se usan</H2>
          <p>
            Para preparar y entregar el pedido, responder consultas, coordinar cambios o
            devoluciones, cumplir obligaciones legales y mantener la seguridad del servicio.
            No se usan para publicidad ni se venden a terceros.
          </p>

          <H2>4. Base legal</H2>
          <p>
            El tratamiento se apoya en la ejecución del pedido y en el consentimiento que
            otorga al enviar el mensaje, además del interés legítimo en mantener el servicio
            seguro, conforme a la normativa de protección de datos personales aplicable en el
            domicilio del negocio.
          </p>

          <H2>5. Conservación</H2>
          <p>
            El negocio conserva la conversación de WhatsApp durante el tiempo necesario para
            el pedido y para cumplir sus obligaciones legales o contables. El sitio no
            conserva pedidos ni datos de clientes.
          </p>

          <H2 id="cookies">6. Cookies y almacenamiento local</H2>
          <p>
            No se usan cookies de publicidad ni de seguimiento. El navegador guarda
            información técnica: la preferencia de tema, una copia del catálogo por 5
            minutos para que la tienda abra más rápido y, solo en el panel de
            administración, la sesión del administrador, que se borra al cerrar la pestaña.
            Puede borrar esos datos desde la configuración de su navegador.
          </p>

          <H2>7. WhatsApp, Facebook y otros servicios</H2>
          <p>
            Al tocar "Enviar pedido por WhatsApp" sale de este sitio y se aplican las
            políticas de privacidad de WhatsApp y Meta. El enlace a Facebook lleva al perfil
            del negocio y también se rige por las políticas de esa red.
          </p>

          <H2>8. Sus derechos</H2>
          <p>
            Puede solicitar acceso, rectificación, actualización o supresión de sus datos
            personales escribiendo a {contacto || 'el negocio'}. Respondemos dentro de los
            plazos legales. La autoridad de control es la que corresponda según el domicilio
            del negocio.
          </p>

          <H2>9. Seguridad</H2>
          <p>
            El acceso al panel está restringido con credenciales, las claves se guardan
            cifradas y la conexión viaja cifrada. Aun así, ningún sistema es infalible: si
            detecta un problema, avísenos al mismo correo de contacto.
          </p>

          <H2>10. Rol de la plataforma</H2>
          <p>
            Dédalo Integraciones provee el software y la infraestructura de la plataforma
            Cuadra. Accede a datos técnicos solo para operar y mantener el servicio y no es
            responsable del tratamiento que el negocio hace de los datos de sus clientes.
          </p>

          <H2>11. Cambios</H2>
          <p>
            Esta política puede actualizarse. La fecha de la última actualización se muestra
            al inicio de la página y los cambios rigen desde su publicación.
          </p>
        </>
      );
    }}
  </LegalShell>
);

export default Privacidad;
