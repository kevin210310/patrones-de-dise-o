interface Hamburger {
	prepare(): void;
}

interface Drink {
	pour(): void;
}

class ChickenHamburger implements Hamburger {
	prepare() {
		console.log("preparando hamburguesa de pollo");
	}
}

class BeefHamburger implements Hamburger {
	prepare() {
		console.log("preparando hamburguesa de carne");
	}
}

class Water implements Drink {
	pour() {
		console.log("sirviendo agua en vaso");
	}
}

class Soda implements Drink {
	pour() {
		console.log("sirviendo gaseosa en vaso");
	}
}

interface RestaurantFactory {
	createHamburger(): Hamburger;
	createDrink(): Drink;
}

class FastFoodRestaurant implements RestaurantFactory {
	createHamburger() {
		return new BeefHamburger();
	}
	
	createDrink() {
		return new Soda();
	}
}

class HealthyFoodRestaurant implements RestaurantFactory {
	createHamburger() {
		return new ChickenHamburger();
	}
	
	createDrink() {
		return new Water();
	}
}