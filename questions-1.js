

const person = {
    name: 'John',
    get aliasName() {
        return this.name +'alias';
    }
}

const person2 = new Proxy(person, {
    get(target, prop, receiver) {
        console.log('get', prop);
        return target[prop]; // 在访问person.name时，也应该被代理
    }
});

const person3 = new Proxy(person, {
    get(target, prop, receiver) {
        console.log('get', prop);
        return Reflect.get(target, prop, receiver); // 在访问person.name时，也应该被代理
    }
});

console.log(person3.aliasName);