# 🎮 Container kingdom

<!--<SHORT-PRESENTATION>-->
Container Kingdom is an interactive visualization tool for Docker containers, using an RPG engine to graphically represent networks and services.
<!--</SHORT-PRESENTATION>-->

---

## 🚀 Try the Demo  

🕹️ Demo: [https://container-kingdom.jlb.ninja/](https://container-kingdom.jlb.ninja/)  

## 🎭 Mock Mode

You can test the frontend without Docker by enabling mock mode. This is useful for:
- Testing UI changes without running the full Docker stack
- Development and debugging of the frontend
- Demonstrations without access to Docker

### Usage

Add `?mock=true` to the URL:
```
http://localhost:8080/?mock=true
```

In mock mode, the application uses fake Docker API data with sample containers instead of connecting to a real Docker API.

