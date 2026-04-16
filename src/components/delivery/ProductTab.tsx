import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Package, 
  RefreshCw, 
  Search, 
  Filter, 
  Edit2, 
  Eye,
  Truck,
  MapPin,
  CheckCircle2,
  Loader2,
  ImageOff,
  Calendar,
  X,
  Plus
} from 'lucide-react';
import { useProducts, TiendanubeProduct, ProductDeliverySettings } from '@/hooks/useProducts';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface ProductTabProps {
  storeId: string | undefined;
  globalSettings: {
    shippingMinDays: number;
    shippingMaxDays: number;
    preparationMinDays: number;
    preparationMaxDays: number;
    workingDays: number[];
    cutoffTime: string;
  };
  appearanceSettings: {
    messageBorderWidth: number;
    messageBorderRadius: number;
    messageBorderStyle: string;
    messageBorderColor: string;
    messageBackgroundColor: string;
    messageTextColor: string;
    progressIconColor: string;
    progressIconBgColor: string;
    progressTitleColor: string;
    progressDateColor: string;
    progressLineColor: string;
  };
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

export function ProductTab({ storeId, globalSettings, appearanceSettings }: ProductTabProps) {
  const {
    products,
    loading,
    error,
    pagination,
    syncing,
    fetchProducts,
    syncAllProducts,
    productSettings,
    updateProductSettings,
    getProductSettings,
    removeProductSettings,
  } = useProducts(storeId);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'added' | 'unadded'>('all');
  const [perPage, setPerPage] = useState('20');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Selection state
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<TiendanubeProduct | null>(null);

  // Edit drawer state
  const [editingProduct, setEditingProduct] = useState<TiendanubeProduct | null>(null);
  const [editSettings, setEditSettings] = useState<ProductDeliverySettings | null>(null);

  // Load products on mount
  useEffect(() => {
    if (storeId) {
      fetchProducts({ page: 1, perPage: parseInt(perPage) });
    }
  }, [storeId, fetchProducts, perPage]);

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = new Map<number, string>();
    products.forEach(p => {
      p.categories?.forEach(c => {
        if (c.id && c.name?.es) {
          cats.set(c.id, c.name.es);
        }
      });
    });
    return Array.from(cats.entries());
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.name?.es || '').toLowerCase().includes(query) ||
        (p.handle?.es || '').toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      const catId = parseInt(categoryFilter);
      result = result.filter(p => 
        p.categories?.some(c => c.id === catId)
      );
    }

    // Status filter (added = has custom settings)
    if (statusFilter === 'added') {
      result = result.filter(p => productSettings.has(p.id));
    } else if (statusFilter === 'unadded') {
      result = result.filter(p => !productSettings.has(p.id));
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [products, searchQuery, categoryFilter, statusFilter, sortBy, productSettings]);

  // Counts for tabs
  const counts = useMemo(() => ({
    all: products.length,
    added: Array.from(productSettings.keys()).filter(id => 
      products.some(p => p.id === id)
    ).length,
    unadded: products.length - Array.from(productSettings.keys()).filter(id => 
      products.some(p => p.id === id)
    ).length,
  }), [products, productSettings]);

  // Handle sync
  const handleSync = async () => {
    try {
      const count = await syncAllProducts();
      toast({
        title: "✓ Sincronización completada",
        description: `Se sincronizaron ${count} productos`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudieron sincronizar los productos",
        variant: "destructive",
      });
    }
  };

  // Handle edit
  const handleEdit = (product: TiendanubeProduct) => {
    const existing = getProductSettings(product.id);
    setEditingProduct(product);
    setEditSettings(existing || {
      productId: product.id,
      deliveryWorkingDays: globalSettings.workingDays,
      orderReadyWorkingDays: globalSettings.workingDays,
      shippingMinDays: globalSettings.shippingMinDays,
      shippingMaxDays: globalSettings.shippingMaxDays,
      preparationMinDays: globalSettings.preparationMinDays,
      preparationMaxDays: globalSettings.preparationMaxDays,
      isCustomized: false,
    });
  };

  // Save edit
  const handleSaveEdit = () => {
    if (editingProduct && editSettings) {
      updateProductSettings(editingProduct.id, editSettings);
      toast({
        title: "✓ Configuración guardada",
        description: `Configuración de "${editingProduct.name?.es}" actualizada`,
      });
      setEditingProduct(null);
      setEditSettings(null);
    }
  };

  // Remove custom settings
  const handleRemoveSettings = () => {
    if (editingProduct) {
      removeProductSettings(editingProduct.id);
      toast({
        title: "Configuración eliminada",
        description: `"${editingProduct.name?.es}" usará la configuración global`,
      });
      setEditingProduct(null);
      setEditSettings(null);
    }
  };

  // Calculate delivery dates for preview
  const getDeliveryDates = (settings: ProductDeliverySettings | null) => {
    const s = settings || {
      shippingMinDays: globalSettings.shippingMinDays,
      shippingMaxDays: globalSettings.shippingMaxDays,
      preparationMinDays: globalSettings.preparationMinDays,
      preparationMaxDays: globalSettings.preparationMaxDays,
    };
    
    const now = new Date();
    const minDate = addDays(now, s.preparationMinDays + s.shippingMinDays);
    const maxDate = addDays(now, s.preparationMaxDays + s.shippingMaxDays);
    
    return { minDate, maxDate };
  };

  // Toggle product selection
  const toggleSelection = (productId: number) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Select all visible products
  const selectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const getProductImage = (product: TiendanubeProduct) => {
    return product.images?.[0]?.src || null;
  };

  const getProductPrice = (product: TiendanubeProduct) => {
    const variant = product.variants?.[0];
    if (!variant?.price) return null;
    return parseFloat(variant.price).toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
    });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Gestión de Productos</h2>
            <p className="text-sm text-muted-foreground">
              Configura reglas específicas de entrega por producto
            </p>
          </div>
          <Button 
            onClick={handleSync} 
            disabled={syncing || !storeId}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar todos los productos
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map(([id, name]) => (
                    <SelectItem key={id} value={String(id)}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Products per page */}
              <Select value={perPage} onValueChange={setPerPage}>
                <SelectTrigger>
                  <SelectValue placeholder="Por página" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 por página</SelectItem>
                  <SelectItem value="20">20 por página</SelectItem>
                  <SelectItem value="50">50 por página</SelectItem>
                  <SelectItem value="100">100 por página</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más recientes</SelectItem>
                  <SelectItem value="oldest">Más antiguos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Status Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
          {[
            { id: 'all', label: 'Todos', count: counts.all },
            { id: 'added', label: 'Añadidos', count: counts.added },
            { id: 'unadded', label: 'Sin añadir', count: counts.unadded },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                statusFilter === tab.id 
                  ? 'bg-background shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <Badge variant="secondary" className="text-xs">
                {tab.count}
              </Badge>
            </button>
          ))}
        </div>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p>{error}</p>
                <Button variant="outline" onClick={() => fetchProducts()} className="mt-4">
                  Reintentar
                </Button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p>No se encontraron productos</p>
                {!products.length && (
                  <Button variant="outline" onClick={handleSync} className="mt-4 gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Sincronizar productos
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                          onCheckedChange={selectAll}
                        />
                      </TableHead>
                      <TableHead className="w-16">Imagen</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Días entrega</TableHead>
                      <TableHead>Días preparación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="w-20">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const settings = getProductSettings(product.id);
                      const isCustomized = settings?.isCustomized || false;
                      const deliveryDays = settings 
                        ? `${settings.shippingMinDays}-${settings.shippingMaxDays}`
                        : `${globalSettings.shippingMinDays}-${globalSettings.shippingMaxDays}`;
                      const readyDays = settings
                        ? `${settings.preparationMinDays}-${settings.preparationMaxDays}`
                        : `${globalSettings.preparationMinDays}-${globalSettings.preparationMaxDays}`;
                      
                      return (
                        <TableRow 
                          key={product.id}
                          className={`cursor-pointer ${selectedProduct?.id === product.id ? 'bg-muted/50' : ''}`}
                          onClick={() => setSelectedProduct(product)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedProducts.has(product.id)}
                              onCheckedChange={() => toggleSelection(product.id)}
                            />
                          </TableCell>
                          <TableCell>
                            {getProductImage(product) ? (
                              <img 
                                src={getProductImage(product)!} 
                                alt={product.name?.es || 'Producto'}
                                className="w-12 h-12 object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                <ImageOff className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium truncate max-w-[200px]">
                                {product.name?.es || 'Sin nombre'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getProductPrice(product)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isCustomized ? "default" : "secondary"}>
                              {deliveryDays} días
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isCustomized ? "default" : "secondary"}>
                              {readyDays} días
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isCustomized ? "default" : "outline"}>
                              {isCustomized ? 'Personalizado' : 'Global'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground truncate block max-w-[100px]">
                              {product.categories?.[0]?.name?.es || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(product.created_at), 'dd/MM/yy', { locale: es })}
                            </span>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination info */}
        {pagination.total > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            Mostrando {filteredProducts.length} de {pagination.total} productos
          </div>
        )}
      </div>

      {/* Preview Panel */}
      <div className="lg:sticky lg:top-6 h-fit">
        <Card className="border-2 border-primary/20 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5 text-primary" />
              Vista Previa
            </CardTitle>
            <CardDescription>
              {selectedProduct 
                ? `Mostrando widget para: ${selectedProduct.name?.es || 'Producto'}` 
                : 'Selecciona un producto para ver la vista previa'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {selectedProduct ? (
              <>
                {/* Product info */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  {getProductImage(selectedProduct) ? (
                    <img 
                      src={getProductImage(selectedProduct)!} 
                      alt={selectedProduct.name?.es || 'Producto'}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                      <ImageOff className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{selectedProduct.name?.es || 'Sin nombre'}</p>
                    <p className="text-sm text-muted-foreground">{getProductPrice(selectedProduct)}</p>
                  </div>
                </div>

                {/* Widget Preview */}
                <div 
                  className="p-4"
                  style={{
                    borderWidth: `${appearanceSettings.messageBorderWidth}px`,
                    borderRadius: `${appearanceSettings.messageBorderRadius}px`,
                    borderStyle: appearanceSettings.messageBorderStyle as 'solid' | 'dashed' | 'dotted',
                    borderColor: appearanceSettings.messageBorderColor,
                    backgroundColor: appearanceSettings.messageBackgroundColor,
                    color: appearanceSettings.messageTextColor,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="rounded-full p-2.5 shrink-0"
                      style={{ backgroundColor: `${appearanceSettings.progressIconBgColor}20` }}
                    >
                      <Truck className="h-5 w-5" style={{ color: appearanceSettings.progressIconBgColor }} />
                    </div>
                    <p className="text-sm font-medium leading-relaxed">
                      {(() => {
                        const settings = getProductSettings(selectedProduct.id);
                        const { minDate, maxDate } = getDeliveryDates(settings || null);
                        return `🚚 Recíbelo entre el ${format(minDate, "EEEE d", { locale: es })} y el ${format(maxDate, "EEEE d 'de' MMMM", { locale: es })}`;
                      })()}
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <div className="relative">
                    <div 
                      className="absolute top-6 left-6 right-6 h-0.5"
                      style={{ background: `linear-gradient(to right, ${appearanceSettings.progressLineColor}, ${appearanceSettings.progressLineColor}80, ${appearanceSettings.progressLineColor}60)` }}
                    />
                    
                    <div className="relative flex justify-between">
                      {/* Ordered */}
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ring-background"
                          style={{ backgroundColor: appearanceSettings.progressIconBgColor }}
                        >
                          <Package className="h-5 w-5" style={{ color: appearanceSettings.progressIconColor }} />
                        </div>
                        <div className="mt-3 text-center">
                          <p className="text-xs font-semibold" style={{ color: appearanceSettings.progressTitleColor }}>
                            Pedido
                          </p>
                          <p className="text-[10px]" style={{ color: appearanceSettings.progressDateColor }}>
                            {format(new Date(), "d MMM", { locale: es })}
                          </p>
                        </div>
                      </div>

                      {/* Ready */}
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ring-background"
                          style={{ backgroundColor: `${appearanceSettings.progressIconBgColor}99` }}
                        >
                          <CheckCircle2 className="h-5 w-5" style={{ color: appearanceSettings.progressIconColor }} />
                        </div>
                        <div className="mt-3 text-center">
                          <p className="text-xs font-semibold" style={{ color: appearanceSettings.progressTitleColor }}>
                            Listo
                          </p>
                          <p className="text-[10px]" style={{ color: appearanceSettings.progressDateColor }}>
                            {(() => {
                              const settings = getProductSettings(selectedProduct.id);
                              const prepDays = settings?.preparationMaxDays || globalSettings.preparationMaxDays;
                              return format(addDays(new Date(), prepDays), "d MMM", { locale: es });
                            })()}
                          </p>
                        </div>
                      </div>

                      {/* Delivered */}
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ring-background"
                          style={{ backgroundColor: `${appearanceSettings.progressIconBgColor}66` }}
                        >
                          <MapPin className="h-5 w-5" style={{ color: appearanceSettings.progressIconColor }} />
                        </div>
                        <div className="mt-3 text-center">
                          <p className="text-xs font-semibold" style={{ color: appearanceSettings.progressTitleColor }}>
                            Entregado
                          </p>
                          <p className="text-[10px]" style={{ color: appearanceSettings.progressDateColor }}>
                            {(() => {
                              const settings = getProductSettings(selectedProduct.id);
                              const { minDate, maxDate } = getDeliveryDates(settings || null);
                              return `${format(minDate, "d", { locale: es })} - ${format(maxDate, "d MMM", { locale: es })}`;
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settings info */}
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tipo de configuración:</span>
                    <Badge variant={getProductSettings(selectedProduct.id)?.isCustomized ? "default" : "secondary"}>
                      {getProductSettings(selectedProduct.id)?.isCustomized ? 'Personalizada' : 'Global'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Días de envío:</span>
                    <span className="font-medium">
                      {(() => {
                        const s = getProductSettings(selectedProduct.id);
                        return s ? `${s.shippingMinDays} - ${s.shippingMaxDays}` : `${globalSettings.shippingMinDays} - ${globalSettings.shippingMaxDays}`;
                      })()} días
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Días de preparación:</span>
                    <span className="font-medium">
                      {(() => {
                        const s = getProductSettings(selectedProduct.id);
                        return s ? `${s.preparationMinDays} - ${s.preparationMaxDays}` : `${globalSettings.preparationMinDays} - ${globalSettings.preparationMaxDays}`;
                      })()} días
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm text-center">
                  Selecciona un producto de la tabla para ver cómo se mostrará el widget
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Drawer */}
      <Sheet open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar configuración de producto</SheetTitle>
            <SheetDescription>
              {editingProduct?.name?.es || 'Producto'}
            </SheetDescription>
          </SheetHeader>

          {editSettings && (
            <div className="space-y-6 mt-6">
              {/* Product Image */}
              {editingProduct && getProductImage(editingProduct) && (
                <div className="flex justify-center">
                  <img 
                    src={getProductImage(editingProduct)!} 
                    alt={editingProduct.name?.es || 'Producto'}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                </div>
              )}

              <Separator />

              {/* Delivery Working Days */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Días laborales de entrega</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-delivery-day-${day.value}`}
                        checked={editSettings.deliveryWorkingDays.includes(day.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditSettings({
                              ...editSettings,
                              deliveryWorkingDays: [...editSettings.deliveryWorkingDays, day.value].sort(),
                            });
                          } else {
                            setEditSettings({
                              ...editSettings,
                              deliveryWorkingDays: editSettings.deliveryWorkingDays.filter(d => d !== day.value),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`edit-delivery-day-${day.value}`} className="text-sm cursor-pointer">
                        {day.short}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Days Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Rango de días de envío</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Mínimo</Label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={editSettings.shippingMinDays}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        shippingMinDays: parseInt(e.target.value) || 0,
                      })}
                    />
                  </div>
                  <span className="text-muted-foreground mt-5">-</span>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Máximo</Label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={editSettings.shippingMaxDays}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        shippingMaxDays: parseInt(e.target.value) || 0,
                      })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order Ready Working Days */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Días laborales de preparación</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-ready-day-${day.value}`}
                        checked={editSettings.orderReadyWorkingDays.includes(day.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditSettings({
                              ...editSettings,
                              orderReadyWorkingDays: [...editSettings.orderReadyWorkingDays, day.value].sort(),
                            });
                          } else {
                            setEditSettings({
                              ...editSettings,
                              orderReadyWorkingDays: editSettings.orderReadyWorkingDays.filter(d => d !== day.value),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`edit-ready-day-${day.value}`} className="text-sm cursor-pointer">
                        {day.short}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preparation Days Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Rango de días de preparación</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Mínimo</Label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={editSettings.preparationMinDays}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        preparationMinDays: parseInt(e.target.value) || 0,
                      })}
                    />
                  </div>
                  <span className="text-muted-foreground mt-5">-</span>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Máximo</Label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={editSettings.preparationMaxDays}
                      onChange={(e) => setEditSettings({
                        ...editSettings,
                        preparationMaxDays: parseInt(e.target.value) || 0,
                      })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button onClick={handleSaveEdit} className="w-full">
                  Guardar configuración
                </Button>
                {getProductSettings(editingProduct?.id || 0)?.isCustomized && (
                  <Button 
                    variant="outline" 
                    onClick={handleRemoveSettings}
                    className="w-full text-destructive hover:text-destructive"
                  >
                    Restablecer a configuración global
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
