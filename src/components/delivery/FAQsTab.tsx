import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  Search, 
  Settings, 
  Plug, 
  Package, 
  CreditCard, 
  LifeBuoy,
  BookOpen,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  faqs: FAQ[];
}

interface FeedbackState {
  [faqId: string]: 'helpful' | 'not-helpful' | null;
}

const FAQ_DATA: FAQCategory[] = [
  {
    id: 'configuration',
    title: 'Configuración y Funcionamiento',
    icon: Settings,
    description: 'Aprende cómo funciona el cálculo de fechas y la configuración básica',
    faqs: [
      {
        id: 'calc-dates',
        question: '¿Cómo se calculan las fechas de entrega?',
        answer: 'El sistema suma los "Días de preparación" + "Días de envío" basándose en los días laborales configurados en la pestaña "Configuración". Si la hora actual supera la "Hora de corte", se añade automáticamente un día adicional al cálculo. Por ejemplo, si configuras 1 día de preparación y 2 de envío, con días laborales de lunes a viernes, el sistema calculará 3 días hábiles desde el momento del pedido.',
        keywords: ['calcular', 'fechas', 'días', 'preparación', 'envío', 'hora corte']
      },
      {
        id: 'variables',
        question: '¿Qué son las variables como {cutoff_time}?',
        answer: 'Son etiquetas dinámicas que el script reemplaza automáticamente en tu tienda por valores reales. Por ejemplo, {cutoff_time} mostrará la hora de corte configurada (ej: 14:00), {order_delivered_minimum_date} mostrará la fecha mínima estimada de entrega, y {today_and_tomorrow} cambiará dinámicamente entre "hoy" y "mañana" según la hora actual.',
        keywords: ['variables', 'etiquetas', 'dinámicas', 'cutoff', 'time', 'reemplazar']
      },
      {
        id: 'working-days',
        question: '¿Cómo funcionan los días laborales?',
        answer: 'Los días laborales determinan qué días de la semana se cuentan para el cálculo de entregas. Si solo seleccionas lunes a viernes, los pedidos realizados el viernes después del corte comenzarán a procesarse el lunes. Puedes personalizar esto según tu operación real.',
        keywords: ['días', 'laborales', 'semana', 'fines de semana', 'sábado', 'domingo']
      },
      {
        id: 'cutoff-time',
        question: '¿Qué es la hora de corte y cómo afecta las entregas?',
        answer: 'La hora de corte es el límite diario para recibir pedidos que se procesarán ese mismo día. Si un cliente compra después de esta hora, el pedido comenzará a procesarse al día siguiente. Es ideal configurarla según el horario real de tu centro de distribución.',
        keywords: ['hora', 'corte', 'límite', 'procesamiento', 'mismo día']
      },
      {
        id: 'timezone',
        question: '¿Se respeta la zona horaria del visitante?',
        answer: 'Sí, el widget puede configurarse para usar la zona horaria del visitante o una zona horaria fija. Esto asegura que los clientes de diferentes regiones vean horarios correctos para su ubicación.',
        keywords: ['zona horaria', 'visitante', 'hora local', 'timezone']
      }
    ]
  },
  {
    id: 'integration',
    title: 'Integración con Tiendanube',
    icon: Plug,
    description: 'Información sobre la instalación y funcionamiento en tu tienda',
    faqs: [
      {
        id: 'manual-code',
        question: '¿Tengo que insertar código manualmente en mi tienda?',
        answer: 'No. Gracias al permiso de "Scripts" de Tiendanube, nuestro widget se inyecta automáticamente debajo del botón de compra sin que necesites tocar ningún código. Si deseas colocarlo en una posición personalizada, puedes usar el modo "Manual" en la pestaña "Apariencia" y agregar un div con id="tiendasync-container" donde quieras que aparezca.',
        keywords: ['código', 'manual', 'insertar', 'automático', 'scripts', 'instalación']
      },
      {
        id: 'instant-changes',
        question: '¿Los cambios son instantáneos?',
        answer: 'Sí. Una vez que guardas la configuración en el panel de administración, los cambios suelen reflejarse en tu tienda en un intervalo de 1 a 10 segundos. No necesitas recargar la página de tu tienda manualmente.',
        keywords: ['cambios', 'instantáneos', 'tiempo', 'guardar', 'reflejar', 'actualizar']
      },
      {
        id: 'compatibility',
        question: '¿Es compatible con todos los temas de Tiendanube?',
        answer: 'Sí, el widget está diseñado para funcionar con todos los temas oficiales de Tiendanube y la mayoría de temas personalizados. Utiliza selectores inteligentes que detectan automáticamente la estructura de tu tienda.',
        keywords: ['compatible', 'temas', 'plantillas', 'diseño', 'personalizado']
      },
      {
        id: 'performance',
        question: '¿El widget afecta la velocidad de mi tienda?',
        answer: 'No. El script está optimizado para cargar de forma asíncrona y pesa menos de 10KB. No bloquea la carga de tu tienda y utiliza caché local para minimizar las peticiones al servidor.',
        keywords: ['velocidad', 'rendimiento', 'lento', 'performance', 'carga', 'optimizado']
      },
      {
        id: 'webhooks',
        question: '¿Qué son los webhooks y cómo funcionan?',
        answer: 'Los webhooks son notificaciones automáticas que Tiendanube envía a nuestra aplicación cuando ocurren eventos importantes, como la creación de un producto o la desinstalación de la app. Esto permite mantener sincronizada tu información en tiempo real sin necesidad de intervención manual.',
        keywords: ['webhooks', 'notificaciones', 'sincronización', 'eventos', 'automático']
      }
    ]
  },
  {
    id: 'products',
    title: 'Productos y Reglas Especiales',
    icon: Package,
    description: 'Configura fechas específicas por producto o categoría',
    faqs: [
      {
        id: 'different-dates',
        question: '¿Puedo tener fechas diferentes para productos distintos?',
        answer: '¡Claro! En la pestaña "Producto" puedes buscar cualquier artículo de tu catálogo y asignar reglas específicas que ignorarán la configuración general de la tienda. Esto es ideal para productos que requieren más tiempo de preparación o provienen de diferentes almacenes.',
        keywords: ['productos', 'diferentes', 'fechas', 'específicas', 'personalizar', 'reglas']
      },
      {
        id: 'out-of-stock',
        question: '¿Qué pasa si un producto no tiene stock?',
        answer: 'Puedes configurar un mensaje personalizado específico para productos "Agotados" desde la pestaña "Widget", informando al cliente sobre tiempos de espera mayores o la posibilidad de pre-ordenar. Este mensaje reemplazará la fecha de entrega estimada normal.',
        keywords: ['stock', 'agotado', 'sin stock', 'disponible', 'fuera de stock']
      },
      {
        id: 'categories',
        question: '¿Puedo configurar reglas por categoría?',
        answer: 'Sí. En la pestaña "Categoría" puedes definir tiempos de preparación y envío específicos para grupos de productos. Las reglas de categoría tienen prioridad sobre las generales, pero las reglas de producto individual tienen la mayor prioridad.',
        keywords: ['categoría', 'categorías', 'grupos', 'colecciones', 'reglas']
      },
      {
        id: 'priority',
        question: '¿Cuál es la prioridad de las reglas?',
        answer: 'La jerarquía de prioridad es: 1° Reglas de producto específico, 2° Reglas de categoría, 3° Configuración general de la tienda. El sistema siempre aplicará la regla más específica disponible.',
        keywords: ['prioridad', 'jerarquía', 'orden', 'reglas', 'configuración']
      },
      {
        id: 'sync-products',
        question: '¿Cómo sincronizo mis productos con la aplicación?',
        answer: 'Puedes sincronizar tus productos desde la pestaña "Producto" usando el botón "Sincronizar todos los productos". Esto actualizará el catálogo local con la información más reciente de Tiendanube, incluyendo nuevos productos, cambios de nombre e imágenes.',
        keywords: ['sincronizar', 'productos', 'actualizar', 'catálogo', 'importar']
      }
    ]
  },
  {
    id: 'plans',
    title: 'Planes y Facturación',
    icon: CreditCard,
    description: 'Información sobre planes, pagos y funcionalidades premium',
    faqs: [
      {
        id: 'free-plan',
        question: '¿Hay un plan gratuito disponible?',
        answer: 'Sí, ofrecemos un plan gratuito con funcionalidades básicas que incluye el widget de fecha estimada, configuración de días laborales y hora de corte. Los planes premium desbloquean características avanzadas como reglas por producto, personalización completa del diseño y soporte prioritario.',
        keywords: ['gratis', 'gratuito', 'plan', 'precio', 'costo']
      },
      {
        id: 'payment-methods',
        question: '¿Qué métodos de pago aceptan?',
        answer: 'Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express) a través de una pasarela segura. Los pagos se procesan mensualmente y puedes cancelar en cualquier momento.',
        keywords: ['pago', 'tarjeta', 'crédito', 'débito', 'facturación', 'método']
      },
      {
        id: 'cancel',
        question: '¿Puedo cancelar mi suscripción en cualquier momento?',
        answer: 'Sí, puedes cancelar tu suscripción premium en cualquier momento desde tu panel de control. Al cancelar, mantendrás acceso a las funciones premium hasta el final del período facturado, y luego tu cuenta pasará automáticamente al plan gratuito.',
        keywords: ['cancelar', 'suscripción', 'baja', 'desinstalar', 'terminar']
      },
      {
        id: 'upgrade',
        question: '¿Cómo puedo cambiar de plan?',
        answer: 'Puedes actualizar o cambiar tu plan en cualquier momento desde la pestaña "Planes". Si actualizas a un plan superior, se aplicará un prorrateo del tiempo restante. Los cambios a planes inferiores se aplican en el siguiente ciclo de facturación.',
        keywords: ['cambiar', 'plan', 'actualizar', 'mejorar']
      },
      {
        id: 'invoice',
        question: '¿Puedo obtener factura de mis pagos?',
        answer: 'Sí, todas las facturas se generan automáticamente y puedes descargarlas desde la sección de facturación en tu panel de control. También recibirás una copia por correo electrónico cada vez que se procese un pago.',
        keywords: ['factura', 'comprobante', 'pago', 'descargar', 'recibo']
      }
    ]
  },
  {
    id: 'support',
    title: 'Soporte y Ayuda',
    icon: LifeBuoy,
    description: 'Obtén ayuda y resuelve problemas comunes',
    faqs: [
      {
        id: 'contact',
        question: '¿Cómo puedo contactar al soporte?',
        answer: 'Puedes contactarnos a través del chat en vivo disponible en el panel de administración (horario: Lunes a Viernes de 9:00 a 18:00 hora Argentina), o enviando un email a soporte@tiendasync.com. Los usuarios premium tienen acceso a soporte prioritario con tiempos de respuesta garantizados.',
        keywords: ['contacto', 'soporte', 'ayuda', 'email', 'chat', 'teléfono']
      },
      {
        id: 'widget-not-showing',
        question: '¿Por qué no aparece el widget en mi tienda?',
        answer: 'Verifica los siguientes puntos: 1) Que hayas guardado la configuración, 2) Que el widget esté habilitado en la pestaña "Widget", 3) Limpia la caché de tu navegador, 4) Asegúrate de estar viendo una página de producto. Si el problema persiste, contacta a soporte con la URL de tu tienda.',
        keywords: ['widget', 'no aparece', 'no muestra', 'invisible', 'problema', 'error']
      },
      {
        id: 'wrong-dates',
        question: '¿Las fechas mostradas son incorrectas?',
        answer: 'Revisa: 1) La configuración de días de preparación y envío, 2) Los días laborales seleccionados, 3) La hora de corte configurada, 4) La zona horaria. Recuerda que el cálculo se basa en días hábiles, no calendario. Si los números no coinciden, verifica que no haya reglas específicas de producto o categoría que estén sobrescribiendo la configuración general.',
        keywords: ['fechas', 'incorrectas', 'mal', 'error', 'cálculo', 'días']
      },
      {
        id: 'documentation',
        question: '¿Dónde puedo encontrar documentación detallada?',
        answer: 'Además de estas preguntas frecuentes, tenemos una base de conocimientos completa en docs.tiendasync.com con guías paso a paso, videos tutoriales y ejemplos de configuración. También puedes acceder a la documentación desde el ícono de ayuda (?) en cualquier sección del panel.',
        keywords: ['documentación', 'docs', 'guía', 'tutorial', 'manual', 'instrucciones']
      },
      {
        id: 'report-bug',
        question: '¿Cómo reporto un error o problema técnico?',
        answer: 'Para reportar un problema técnico, envía un email a soporte@tiendasync.com incluyendo: 1) URL de tu tienda, 2) Descripción detallada del problema, 3) Capturas de pantalla si es posible, 4) Pasos para reproducir el error. Nuestro equipo técnico revisará el caso y te contactará en un máximo de 24 horas.',
        keywords: ['reportar', 'error', 'problema', 'bug', 'técnico', 'fallo']
      }
    ]
  }
];

export function FAQsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['configuration']);
  const [feedback, setFeedback] = useState<FeedbackState>({});

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_DATA;

    const query = searchQuery.toLowerCase().trim();
    
    return FAQ_DATA.map(category => ({
      ...category,
      faqs: category.faqs.filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.keywords.some(keyword => keyword.toLowerCase().includes(query))
      )
    })).filter(category => category.faqs.length > 0);
  }, [searchQuery]);

  const totalResults = useMemo(() => 
    filteredCategories.reduce((acc, cat) => acc + cat.faqs.length, 0),
    [filteredCategories]
  );

  const hasResults = filteredCategories.length > 0;

  const handleFeedback = (faqId: string, type: 'helpful' | 'not-helpful') => {
    setFeedback(prev => ({
      ...prev,
      [faqId]: prev[faqId] === type ? null : type
    }));
    
    if (feedback[faqId] !== type) {
      toast({
        title: type === 'helpful' ? "¡Gracias por tu opinión!" : "Lamentamos que no fuera útil",
        description: type === 'helpful' 
          ? "Nos alegra que esta respuesta te haya ayudado." 
          : "Trabajaremos para mejorar esta respuesta.",
      });
    }
  };

  const getFeedbackStats = () => {
    const helpful = Object.values(feedback).filter(v => v === 'helpful').length;
    const notHelpful = Object.values(feedback).filter(v => v === 'not-helpful').length;
    return { helpful, notHelpful, total: helpful + notHelpful };
  };

  const stats = getFeedbackStats();

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Encabezado */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Centro de Ayuda</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Encuentra respuestas a las preguntas más frecuentes sobre la configuración y uso del widget de Entrega Estimada
        </p>
      </div>

      {/* Barra de búsqueda */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar pregunta, palabra clave o tema..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base bg-background"
            />
          </div>
          {searchQuery && (
            <div className="text-center mt-3 text-sm text-muted-foreground">
              {hasResults ? (
                <span>
                  Se encontraron <Badge variant="secondary">{totalResults}</Badge> resultado{totalResults !== 1 ? 's' : ''} 
                  {' '}en <Badge variant="outline">{filteredCategories.length}</Badge> categoría{filteredCategories.length !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-destructive">No se encontraron resultados para "{searchQuery}"</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas de feedback */}
      {stats.total > 0 && (
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{stats.helpful} respuesta{stats.helpful !== 1 ? 's' : ''} útil{stats.helpful !== 1 ? 'es' : ''}</span>
          </div>
          <span>•</span>
          <span>Has evaluado {stats.total} pregunta{stats.total !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Categorías de preguntas frecuentes */}
      {hasResults ? (
        <div className="space-y-4">
          {filteredCategories.map((category) => {
            const CategoryIcon = category.icon;
            const isExpanded = expandedCategories.includes(category.id) || searchQuery.trim() !== '';
            
            return (
              <Card key={category.id} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    if (searchQuery.trim()) return;
                    setExpandedCategories(prev => 
                      prev.includes(category.id) 
                        ? prev.filter(id => id !== category.id)
                        : [...prev, category.id]
                    );
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <CategoryIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {category.faqs.length} pregunta{category.faqs.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="pt-0 border-t">
                    <Accordion 
                      type="multiple" 
                      className="w-full"
                      defaultValue={searchQuery ? category.faqs.map(f => f.id) : []}
                    >
                      {category.faqs.map((faq) => (
                        <AccordionItem 
                          key={faq.id} 
                          value={faq.id}
                          className="border-b last:border-b-0"
                        >
                          <AccordionTrigger className="text-left hover:no-underline py-4">
                            <span className="font-medium pr-4">{faq.question}</span>
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground pb-4">
                            <p className="leading-relaxed mb-4">{faq.answer}</p>
                            
                            {/* Sistema de feedback */}
                            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/50">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">¿Te resultó útil esta respuesta?</span>
                                <div className="flex gap-1">
                                  <Button
                                    variant={feedback[faq.id] === 'helpful' ? 'default' : 'outline'}
                                    size="sm"
                                    className="h-8 px-2.5 gap-1.5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFeedback(faq.id, 'helpful');
                                    }}
                                  >
                                    <ThumbsUp className="h-3.5 w-3.5" />
                                    <span className="text-xs">Sí</span>
                                  </Button>
                                  <Button
                                    variant={feedback[faq.id] === 'not-helpful' ? 'destructive' : 'outline'}
                                    size="sm"
                                    className="h-8 px-2.5 gap-1.5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFeedback(faq.id, 'not-helpful');
                                    }}
                                  >
                                    <ThumbsDown className="h-3.5 w-3.5" />
                                    <span className="text-xs">No</span>
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Palabras clave */}
                              {faq.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {faq.keywords.slice(0, 4).map((keyword) => (
                                    <Badge 
                                      key={keyword} 
                                      variant="outline" 
                                      className="text-xs cursor-pointer hover:bg-primary/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchQuery(keyword);
                                      }}
                                    >
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No encontramos lo que buscas</h3>
            <p className="text-muted-foreground mb-4">
              Intenta con otras palabras clave o contacta a nuestro equipo de soporte
            </p>
            <div className="flex justify-center gap-2">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setSearchQuery('configuración')}
              >
                configuración
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setSearchQuery('widget')}
              >
                widget
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setSearchQuery('fechas')}
              >
                fechas
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tarjeta de contacto de soporte */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <LifeBuoy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">¿No encontraste tu respuesta?</h3>
                <p className="text-sm text-muted-foreground">
                  Nuestro equipo de soporte está listo para ayudarte
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="px-4 py-2">
                soporte@tiendasync.com
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
