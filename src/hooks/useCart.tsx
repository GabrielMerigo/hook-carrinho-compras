import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<React.ReactText | undefined>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: productStock } = await api.get(`/stock/${productId}`);
      const { data: product } = await api.get(`/products/${productId}`);

      const hasProductInTheCart = cart.some(product => product.id === productId);

      if(hasProductInTheCart) return toast.error('Já existe esse produto no carrinho');
      if(productStock.amount === 0) return toast.error('Quantidade solicitada fora de estoque');

      const newProductIntoCart = {
        ...product,
        amount: product.amount ? product.amount + 1 : 1
      }

      const cartUpdated = [
        ...cart,
        newProductIntoCart
      ];

      setCart(cartUpdated)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const cartUpdated = cart.filter(product => product.id !== productId);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated));

      setCart(cartUpdated);
    } catch {
      toast.error('Erro na remoção do produto');
      throw new Error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const updatedCart = [...cart];
      const productExists = updatedCart.find((product) => product.id === productId);
      const { data: productStock } = await api.get(`/stock/${productId}`);

      if(amount > productStock.amount){
        return toast.error('Quantidade solicitada fora de estoque');
      }

      if(productExists){
        productExists.amount = amount;
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      }
      
    } catch {
      toast.error('Erro na atualização do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
